const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { v4: uuid } = require('uuid')

const startUploadJob = require('../../../../../src/modules/returns/lib/jobs/start-upload')
const { logger } = require('../../../../../src/logger')
const Event = require('../../../../../src/lib/models/event')

const eventId = uuid()
const companyId = uuid()

experiment('start-upload', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info').returns()
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createMessage', () => {
    let message, event

    experiment('when the upload type is CSV', () => {
      beforeEach(async () => {
        event = new Event(eventId)
        event.subtype = 'csv'
        message = startUploadJob.createMessage(event, companyId)
      })

      test('creates a message with the expected name', async () => {
        expect(message[0]).to.equal(startUploadJob.jobName)
      })

      test('the message has the expected job data', async () => {
        expect(message[1]).to.equal({
          eventId,
          companyId,
          subtype: 'csv'
        })
      })
    })
  })
})
