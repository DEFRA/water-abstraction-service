const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const controller = require('../../../src/modules/batch-notifications/controller')
const eventsService = require('../../../src/lib/services/events')
const Event = require('../../../src/lib/models/event')
const messageHelpers = require('../../../src/modules/batch-notifications/lib/message-helpers')
const { EVENT_STATUS_PROCESSED } = require('../../../src/modules/batch-notifications/lib/event-statuses')
const sendBatch = require('../../../src/modules/batch-notifications/lib/send-batch')
const { logger } = require('../../../src/logger')

const eventId = uuid()

const createEvent = () => {
  const event = new Event(eventId)
  event.fromHash({
    type: 'notification',
    eventId: 'testEvent',
    status: EVENT_STATUS_PROCESSED,
    issuer: 'mail@example.com'
  })
  return event
}
experiment('batch notifications controller', () => {
  let request, h, code

  const expectErrorResponse = statusCode => {
    const [response] = h.response.lastCall.args
    expect(response.error).to.be.a.string()
    expect(response.data).to.equal(null)
    const [status] = code.lastCall.args
    expect(status).to.equal(statusCode)
  }

  beforeEach(async () => {
    // Stub HAPI response toolkit
    code = sandbox.stub()
    h = {
      response: sandbox.stub().returns({
        code
      })
    }

    const eventModel = createEvent()

    // Other APIs
    sandbox.stub(eventsService, 'create').resolves(eventModel)
    sandbox.stub(eventsService, 'findOne').resolves(eventModel)
    sandbox.stub(eventsService, 'updateStatus').resolves(eventModel)

    sandbox.stub(messageHelpers, 'updateMessageStatuses').resolves()

    sandbox.stub(sendBatch, 'send').resolves({})
    sandbox.stub(logger, 'error').returns()
  })

  afterEach(async () => sandbox.restore())

  experiment('postPrepare', () => {
    beforeEach(async () => {
      request = {
        params: {
          messageType: 'returnReminder'
        },
        payload: {
          issuer: 'mail@example.com',
          data: {
            excludeLicences: ['01/123']
          }
        },
        queueManager: {
          add: sandbox.stub().resolves()
        }
      }
    })

    test('responds with a 400 error if the request payload doesnt validate', async () => {
      request.payload.data.foo = 'bar'
      await controller.postPrepare(request, h)
      expectErrorResponse(400)
    })

    test('persists an event', async () => {
      await controller.postPrepare(request, h)
      expect(eventsService.create.callCount).to.equal(1)
    })

    test('creates an event using issuer, config, and payload data', async () => {
      await controller.postPrepare(request, h)
      const event = eventsService.create.lastCall.args[0]

      expect(event.issuer).to.equal(request.payload.issuer)
      expect(event.subtype).to.equal(request.params.messageType)
      expect(event.metadata.options).to.equal(request.payload.data)
    })

    test('event metadata includes return cycle data', async () => {
      await controller.postPrepare(request, h)
      const event = eventsService.create.lastCall.args[0]
      const keys = Object.keys(event.metadata.returnCycle)
      expect(keys).to.only.include(['startDate', 'endDate', 'isSummer', 'dueDate'])
    })

    test('publishes event to start building recipient list', async () => {
      await controller.postPrepare(request, h)
      expect(request.queueManager.add.callCount).to.equal(1)
      const { args } = request.queueManager.add.lastCall
      expect(args[0]).to.equal('notifications.getRecipients')
      expect(args[1]).to.equal(eventId)
    })

    test('responds with event data', async () => {
      const response = await controller.postPrepare(request, h)
      expect(response.error).to.equal(null)
      expect(response.data.id).to.equal(eventId)
    })

    test('responds with a 500 error if an error is thrown', async () => {
      eventsService.create.throws()
      await controller.postPrepare(request, h)
      expectErrorResponse(500)
    })
  })

  experiment('postSend', () => {
    beforeEach(async () => {
      request = {
        params: {
          eventId: 'testEvent'
        },
        payload: {
          issuer: 'mail@example.com'
        }
      }
    })

    experiment('when there is no error', () => {
      let result

      beforeEach(async () => {
        result = await controller.postSend(request)
      })

      test('the batch is sent', async () => {
        expect(sendBatch.send.calledWith(
          request.params.eventId, request.payload.issuer
        )).to.be.true()
      })

      test('resolves with data in the expected shape', async () => {
        expect(result.error).to.be.null()
        expect(result.data).to.be.an.object()
      })
    })

    experiment('when there is an error', () => {
      let result, err

      beforeEach(async () => {
        err = new Error('oops!')
        sendBatch.send.rejects(err)
        const func = () => controller.postSend(request)
        result = await expect(func()).to.reject()
      })

      test('the error is logged', async () => {
        expect(logger.error.calledWith(
          'Batch notification send error',
          err,
          { eventId: request.params.eventId }
        )).to.be.true()
      })

      test('the error is rethrown', async () => {
        expect(result).to.equal(err)
      })
    })
  })
})
