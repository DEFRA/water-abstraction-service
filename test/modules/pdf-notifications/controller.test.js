'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const controller = require('../../../src/modules/pdf-notifications/controller')
const scheduledNotificationService = require('../../../src/lib/services/scheduled-notifications')
const htmlGeneration = require('../../../src/lib/services/pdf-generation/html')

experiment('src/modules/pdf-notifications/controller', () => {
  experiment('getRenderNotification', () => {
    let request
    let notification

    beforeEach(async () => {
      request = {
        params: {
          notificationId: 'test'
        }
      }

      notification = {
        id: 123,
        messageRef: 'pdf.test'
      }

      sandbox.stub(htmlGeneration, 'createHtmlFromScheduledNotification')
      sandbox.stub(scheduledNotificationService, 'getScheduledNotificationById').resolves(notification)

      await controller.getRenderNotification(request)
    })

    afterEach(async () => {
      sandbox.restore()
    })

    test('gets the notification using the ids from the request', async () => {
      const [id] = scheduledNotificationService.getScheduledNotificationById.lastCall.args
      expect(id).to.equal(request.params.notificationId)
    })

    test('the found notification model is used to generate the HTML', async () => {
      const [model] = htmlGeneration.createHtmlFromScheduledNotification.lastCall.args
      expect(model).to.equal(notification)
    })
  })
})
