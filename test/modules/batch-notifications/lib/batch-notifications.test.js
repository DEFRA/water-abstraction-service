const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { loadJobData } =
require('../../../../src/modules/batch-notifications/lib/batch-notifications')
const eventsService = require('../../../../src/lib/services/events')
const Event = require('../../../../src/lib/models/event')
const { v4: uuid } = require('uuid')

const eventId = uuid()

const createEvent = () => {
  const event = new Event()
  return event.fromHash({
    id: eventId,
    subtype: 'returnReminder'
  })
}

experiment('batch notifications helpers', () => {
  const event = createEvent()

  beforeEach(async () => {
    sandbox.stub(eventsService, 'findOne').resolves(event)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('loadJobData', () => {
    test('throws an error if the event cannot be found', async () => {
      eventsService.findOne.resolves(undefined)
      expect(loadJobData()).to.reject()
    })

    test('throws an error if the config cannot be found', async () => {
      eventsService.findOne.resolves(
        createEvent().fromHash({
          subtype: 'unknownMessageType'
        })
      )
      expect(loadJobData()).to.reject()
    })

    test('resolves with event and message data if found', async () => {
      const result = await loadJobData()
      expect(result.ev.id).to.equal(event.id)
      expect(result.config.messageType).to.equal('returnReminder')
    })
  })
})
