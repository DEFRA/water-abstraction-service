'use strict'

const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()

const preHandlers = require('../../../src/modules/notifications/pre-handlers')
const Event = require('../../../src/lib/models/event')
const eventsService = require('../../../src/lib/services/events')

experiment('modules/notifications/pre-handlers', () => {
  const eventId = uuid()
  let result
  const request = {
    params: {
      eventId
    }
  }

  beforeEach(async () => {
    sandbox.stub(eventsService, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getEvent', () => {
    experiment('when the event is not found', () => {
      beforeEach(async () => {
        eventsService.findOne.resolves(null)
        result = await preHandlers.getEvent(request)
      })

      test('the event is fetched from the event service', async () => {
        expect(eventsService.findOne.calledWith(eventId)).to.be.true()
      })

      test('a Boom 404 is returned', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the event is not a "notification" type', () => {
      beforeEach(async () => {
        const ev = new Event(eventId).fromHash({
          type: 'not-a-notification'
        })
        eventsService.findOne.resolves(ev)
        result = await preHandlers.getEvent(request)
      })

      test('the event is fetched from the event service', async () => {
        expect(eventsService.findOne.calledWith(eventId)).to.be.true()
      })

      test('a Boom 404 is returned', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the event has a "notification" type', () => {
      const ev = new Event(eventId).fromHash({
        type: Event.eventTypes.notification
      })

      beforeEach(async () => {
        eventsService.findOne.resolves(ev)
        result = await preHandlers.getEvent(request)
      })

      test('the event is fetched from the event service', async () => {
        expect(eventsService.findOne.calledWith(eventId)).to.be.true()
      })

      test('the model is returned', async () => {
        expect(result).to.equal(ev)
      })
    })
  })
})
