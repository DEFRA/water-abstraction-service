'use strict'

const { expect } = require('@hapi/code')
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const eventsService = require('../../../../src/lib/services/events.js')
const { EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING } = require('../../../../src/modules/batch-notifications/lib/event-statuses.js')
const messageHelpers = require('../../../../src/modules/batch-notifications/lib/message-helpers.js')
const { MESSAGE_STATUS_SENDING } = require('../../../../src/modules/batch-notifications/lib/message-statuses.js')
const sendBatch = require('../../../../src/modules/batch-notifications/lib/send-batch.js')

let mockEvent
const eventId = 'testEventId'
const issuer = 'testIssuer'

experiment('Send-batch', () => {
  beforeEach(async () => {
    mockEvent = {
      id: eventId,
      type: 'notification',
      status: EVENT_STATUS_PROCESSED,
      issuer
    }

    sandbox.stub(eventsService, 'findOne').resolves(mockEvent)
    sandbox.stub(messageHelpers, 'updateMessageStatuses').resolves()
    sandbox.stub(eventsService, 'updateStatus').resolves(mockEvent)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('send', () => {
    test('returns the event if it is a duplicate', async () => {
      mockEvent.status = EVENT_STATUS_SENDING
      const result = await sendBatch.send(eventId, issuer)

      expect(result).to.equal(mockEvent)
    })

    test('throws an error if the event cannot be found', async () => {
      eventsService.findOne.resolves(undefined)

      await expect(sendBatch.send(eventId, issuer)).to.reject()
    })

    test('throws an error if the event is not of type "notification"', async () => {
      mockEvent.type = 'otherType'

      await expect(sendBatch.send(eventId, issuer)).to.reject()
    })

    test('throws an error if the event status is not EVENT_STATUS_PROCESSED', async () => {
      mockEvent.status = 'otherStatus'

      await expect(sendBatch.send(eventId, issuer)).to.reject()
    })

    test('throws an error if the issuer does not match the event issuer', async () => {
      const invalidIssuer = 'invalidIssuer'

      await expect(sendBatch.send(eventId, invalidIssuer)).to.reject()
    })

    test('updates message statuses and event status to EVENT_STATUS_SENDING', async () => {
      const result = await sendBatch.send(eventId, issuer)

      expect(result).to.equal(mockEvent)
      sinon.assert.calledOnce(messageHelpers.updateMessageStatuses)
      sinon.assert.calledWithExactly(messageHelpers.updateMessageStatuses, eventId, MESSAGE_STATUS_SENDING)
      sinon.assert.calledOnce(eventsService.updateStatus)
      sinon.assert.calledWithExactly(eventsService.updateStatus, eventId, EVENT_STATUS_SENDING)
    })
  })
})
