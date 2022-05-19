'use strict'

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const routes = require('../../../src/modules/notifications/routes')
const preHandlers = require('../../../src/modules/notifications/pre-handlers')

experiment('modules/notifications/routes', () => {
  experiment('.getNotification', () => {
    test('includes the .getEvent pre handler', async () => {
      expect(routes.getNotification.options.pre).to.include({
        method: preHandlers.getEvent,
        assign: 'event'
      })
    })
  })

  experiment('.getNotificationMessages', () => {
    test('includes the .getEvent pre handler', async () => {
      expect(routes.getNotificationMessages.options.pre).to.include({
        method: preHandlers.getEvent,
        assign: 'event'
      })
    })
  })
})
