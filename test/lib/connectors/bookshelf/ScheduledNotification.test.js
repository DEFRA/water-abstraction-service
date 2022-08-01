'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ScheduledNotification = require('../../../../src/lib/connectors/bookshelf/ScheduledNotification')

experiment('lib/connectors/bookshelf/ScheduledNotification', () => {
  let instance

  beforeEach(async () => {
    instance = ScheduledNotification.forge()
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.scheduled_notification table', async () => {
    expect(instance.tableName).to.equal('water.scheduled_notification')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('id')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created'])
  })

  experiment('the .event() relation', () => {
    beforeEach(async () => {
      instance.event()
    })

    test('is a function', async () => {
      expect(instance.event).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('Event')
      expect(foreignKey).to.equal('event_id')
      expect(foreignKeyTarget).to.equal('event_id')
    })
  })
})
