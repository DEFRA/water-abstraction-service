const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const queries = require('../../../../src/modules/batch-notifications/lib/queries')
const { createEvent, markAsProcessed } =
require('../../../../src/modules/batch-notifications/lib/event-helpers')
const { EVENT_STATUS_PROCESSING, EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING, EVENT_STATUS_COMPLETED } =
require('../../../../src/modules/batch-notifications/lib/event-statuses')
const { MESSAGE_STATUS_SENT, MESSAGE_STATUS_ERROR } =
require('../../../../src/modules/batch-notifications/lib/message-statuses')

const eventsService = require('../../../../src/lib/services/events')
const Event = require('../../../../src/lib/models/event')

const issuer = 'mail@example.com'
const config = {
  messageType: 'testType',
  prefix: 'TEST-',
  name: 'My test'
}
const options = {
  foo: 'bar'
}

const eventId = uuid()

const createEventModel = () => {
  const event = new Event(eventId)
  return event.fromHash({
    eventId: 'testEventId',
    status: 'testStatus',
    type: 'notification',
    metadata: {
      foo: 'bar'
    }
  })
}

experiment('batch notifications event helpers', () => {
  let event

  beforeEach(async () => {
    event = createEventModel()
    sandbox.stub(eventsService, 'findOne').resolves(event)
    sandbox.stub(eventsService, 'update').resolves(event)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('createEvent ', () => {
    let createdEvent

    experiment('should create an event', () => {
      beforeEach(async () => {
        createdEvent = createEvent(issuer, config, options)
      })

      test('with a reference code using the prefix in the notification config', async () => {
        expect(createdEvent.referenceCode).to.startWith('TEST-')
      })

      test('with a type of "notification"', async () => {
        expect(createdEvent.type).to.equal('notification')
      })

      test('with a subtype using the messageType in the notification config', async () => {
        expect(createdEvent.subtype).to.equal(config.messageType)
      })

      test('with the issuer passed in', async () => {
        expect(createdEvent.issuer).to.equal(issuer)
      })

      test('with the correct metadata', async () => {
        expect(createdEvent.metadata).to.equal({
          name: config.name,
          options
        })
      })

      test('with a status of "processing"', async () => {
        expect(createdEvent.status).to.equal(EVENT_STATUS_PROCESSING)
      })
    })
  })

  experiment('markAsProcessed', () => {
    const licenceNumbers = ['01/123', '04/567']
    const recipients = 10

    beforeEach(async () => {
      await markAsProcessed('testEventId', licenceNumbers, recipients)
    })

    test('should load the event with the supplied ID', async () => {
      expect(eventsService.findOne.firstCall.args[0]).to.equal('testEventId')
    })

    test('should mark the event as processed', async () => {
      const [event] = eventsService.update.firstCall.args
      expect(event.status).to.equal(EVENT_STATUS_PROCESSED)
    })

    test('should record the affected licence numbers', async () => {
      const [event] = eventsService.update.firstCall.args
      expect(event.licences).to.equal(licenceNumbers)
    })

    test('should update the event metadata', async () => {
      const [event] = eventsService.update.firstCall.args
      expect(event.metadata.sent).to.equal(0)
      expect(event.metadata.error).to.equal(0)
      expect(event.metadata.recipients).to.equal(recipients)
    })

    test('should not alter existing metadata', async () => {
      const [event] = eventsService.update.firstCall.args
      expect(event.metadata.foo).to.equal('bar')
    })
  })
})
