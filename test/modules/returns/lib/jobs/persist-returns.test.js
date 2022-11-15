const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test,
  fail
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { v4: uuid } = require('uuid')

const persistReturnsJob = require('../../../../../src/modules/returns/lib/jobs/persist-returns')
const returnsUpload = require('../../../../../src/modules/returns/lib/returns-upload')
const { logger } = require('../../../../../src/logger')
const returnsConnector = require('../../../../../src/modules/returns/lib/api-connector')

const eventsService = require('../../../../../src/lib/services/events')
const errorEvent = require('../../../../../src/modules/returns/lib/jobs/error-event')

const eventId = uuid()

experiment('persist-returns', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message

    beforeEach(async () => {
      message = persistReturnsJob.createMessage({ eventId })
    })

    test('creates a message with the expected name', async () => {
      expect(message[0]).to.equal(persistReturnsJob.jobName)
    })

    test('the message has the expected job data', async () => {
      expect(message[1]).to.equal({
        eventId,
        subtype: 'csv'
      })
    })
  })

  experiment('handler', () => {
    let job
    let testError

    beforeEach(async () => {
      sandbox.stub(eventsService, 'findOne').resolves({
        metadata: {
          returns: [
            { returnId: 'test-return-1', submitted: false, error: null },
            { returnId: 'test-return-2', submitted: false, error: null }
          ]
        }
      })
      sandbox.stub(eventsService, 'update').resolves()
      sandbox.stub(errorEvent, 'throwEventNotFoundError')

      sandbox.stub(returnsUpload, 'getReturnsS3Object').resolves({
        Body: Buffer.from(JSON.stringify([
          { returnId: 'test-return-1', returnRequirement: '11111111' },
          { returnId: 'test-return-2', returnRequirement: '22222222' }
        ]), 'utf-8')
      })

      testError = new Error('test-error')

      sandbox.stub(returnsConnector, 'persistReturnData')
        .onFirstCall().resolves({
          return: true,
          version: true,
          lines: true
        })
        .onSecondCall().rejects(testError)

      job = {
        data: { eventId: 'test-event-id', key: 'test-s3-key' },
        done: sinon.spy()
      }
    })

    test('loads the event', async () => {
      await persistReturnsJob.handler(job)
      expect(eventsService.findOne.calledWith(job.data.eventId)).to.be.true()
    })

    test('calls throwEventNotFoundError if event is not found', async () => {
      eventsService.findOne.resolves()
      await persistReturnsJob.handler(job)
      expect(errorEvent.throwEventNotFoundError.calledWith(job.data.eventId)).to.be.true()
    })

    test('loads the S3 object', async () => {
      await persistReturnsJob.handler(job)
      const [eventId, type] = returnsUpload.getReturnsS3Object.lastCall.args
      expect(eventId).to.equal('test-event-id')
      expect(type).to.equal('json')
    })

    test('attempts to save both returns', async () => {
      await persistReturnsJob.handler(job)

      const firstReturn = returnsConnector.persistReturnData.firstCall.args[0]
      const secondReturn = returnsConnector.persistReturnData.secondCall.args[0]

      expect(firstReturn.returnId).to.equal('test-return-1')
      expect(secondReturn.returnId).to.equal('test-return-2')
    })

    test('updates the event metadata with the upload result', async () => {
      await persistReturnsJob.handler(job)
      const [event] = eventsService.update.lastCall.args
      expect(event.metadata).to.equal({
        returns: [
          { returnId: 'test-return-1', submitted: true, error: null },
          { returnId: 'test-return-2', submitted: false, error: testError }
        ]
      })
    })

    test('sets the event status to submitted on completion', async () => {
      await persistReturnsJob.handler(job)
      const [event] = eventsService.update.lastCall.args
      expect(event.status).to.equal(returnsUpload.uploadStatus.SUBMITTED)
    })

    experiment('when there is an error', () => {
      beforeEach(async () => {
        try {
          returnsUpload.getReturnsS3Object.rejects(testError)
          await persistReturnsJob.handler(job)
          fail()
        } catch (err) {

        }
      })

      test('the error is logged', async () => {
        const [message, error, params] = logger.error.lastCall.args
        expect(message).to.equal('Failed to persist bulk returns upload')
        expect(error).to.equal(testError.stack)
        expect(params.job).to.equal(job)
      })

      test('the status is set to error', async () => {
        const [evt] = eventsService.update.lastCall.args
        expect(evt.status).to.equal('error')
      })
    })
  })
})
