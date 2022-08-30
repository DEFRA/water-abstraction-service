'use strict'

// Test framework dependencies
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const nock = require('nock')

// Things we need to stub
const { logger } = require('../../src/logger')
const scheduledNotificationsService = require('../../src/lib/services/scheduled-notifications')

// Thing under test
const { server, start } = require('../../index.js')

experiment('Notify controller', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'error').returns()
    sandbox.stub(logger, 'info').returns()
    await start()
  })

  afterEach(async () => {
    sandbox.restore()
    nock.cleanAll()
  })

  experiment('notify/', () => {
    let request

    const createRequest = (url) => {
      return {
        method: 'POST',
        url,
        payload: {
          recipient: 'test@test.com',
          personalisation: {
            test_value: '00/00/00/00'
          }
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }
    }

    experiment('when the request is valid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/8ac8a279-bf93-44da-b536-9b05703cb928/preview')
          .reply(200, { body: '', type: '' })

        request = createRequest('/water/1.0/notify/unit_test_email')
      })

      test('we return a 200 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(200)
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/abcd/preview')
          .reply(400, { errors: [{ error: 'ValidationError', message: 'id is not a valid UUID' }], status_code: 400 })

        request = createRequest('/water/1.0/notify/unit_test_missing_in_notify')
      })

      test('we return a 400 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(400)
      })
    })

    experiment('when an unexpected error occurs within the service', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/8ac8a279-bf93-44da-b536-9b05703cb928/preview')
          .reply(500)

        request = createRequest('/water/1.0/notify/unit_test_email')
      })

      test('we return a 500 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(500)
      })
    })
  })

  experiment('notifyLater/', () => {
    let request

    const createRequest = (url) => {
      return {
        method: 'POST',
        url,
        payload: {
          recipient: 'test@test.com',
          personalisation: {
            test_value: '00/00/00/00'
          }
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }
    }

    experiment('when the request is valid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/8ac8a279-bf93-44da-b536-9b05703cb928/preview')
          .reply(200, { body: 'It has a test value of 00/00/00/00', type: 'email' })

        request = createRequest('/water/1.0/notifyLater/unit_test_email')
      })

      test('we return a 200 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(200)
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/abcd/preview')
          .reply(400, { errors: [{ error: 'ValidationError', message: 'id is not a valid UUID' }], status_code: 400 })

        request = createRequest('/water/1.0/notifyLater/unit_test_missing_in_notify')
      })

      test('we return a 400 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(400)
      })
    })

    experiment('when an unexpected error occurs within the service', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/template/8ac8a279-bf93-44da-b536-9b05703cb928/preview')
          .reply(500)

        request = createRequest('/water/1.0/notifyLater/unit_test_email')
      })

      test('we return a 500 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(500)
      })
    })
  })

  experiment('notify/callback', () => {
    let request

    const createRequest = (url) => {
      return {
        method: 'POST',
        url,
        payload: {
          id: '9b23538e-c493-4b4f-baa7-2a76f643aa1f',
          reference: 'foobar',
          to: 'stuart@example.com',
          status: 'delivered',
          created_at: '2022-08-09T10:10:31+0000',
          completed_at: '2022-08-09T10:10:31+0000',
          sent_at: '2022-08-09T10:10:31+0000',
          notification_type: 'email',
          template_id: '8ac8a279-bf93-44da-b536-9b05703cb928',
          template_version: 2
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }
    }

    beforeEach(async () => {
      sandbox.stub(scheduledNotificationsService, 'updateScheduledNotificationWithNotifyCallback')

      request = createRequest('/water/1.0/notify/callback')
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        sandbox.stub(scheduledNotificationsService, 'getScheduledNotificationByNotifyId').resolves({ id: '123' })
      })

      test('we return a 204 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(204)
      })

      test('we call the update function', async () => {
        await server.inject(request)
        expect(scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.called).to.be.true()
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        sandbox.stub(scheduledNotificationsService, 'getScheduledNotificationByNotifyId').resolves(null)
      })

      test('we return a 404 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(404)
      })

      test('we do not call the update function', async () => {
        await server.inject(request)
        expect(scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.called).to.be.false()
      })
    })

    experiment('when an error occurs', () => {
      beforeEach(() => {
        sandbox.stub(scheduledNotificationsService, 'getScheduledNotificationByNotifyId').throws()
      })

      test('we return a 500 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(500)
      })

      test('we do not call the update function', async () => {
        await server.inject(request)
        expect(scheduledNotificationsService.updateScheduledNotificationWithNotifyCallback.called).to.be.false()
      })
    })
  })

  experiment('notify/email', () => {
    let request

    const createRequest = (url) => {
      return {
        method: 'POST',
        url,
        payload: {
          templateId: '8ac8a279-bf93-44da-b536-9b05703cb928',
          recipient: 'test@test.com',
          personalisation: {
            test_value: '00/00/00/00'
          }
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }
    }

    afterEach(() => {
      nock.cleanAll()
    })

    experiment('when the request is valid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/notifications/email')
          .reply(201)

        request = createRequest('/water/1.0/notify/email')
      })

      test('we return a 201 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(201)
      })
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        nock('https://api.notifications.service.gov.uk:443')
          .post('/v2/notifications/email')
          .reply(400)

        request = createRequest('/water/1.0/notify/email')
      })

      test('we return a 500 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(500)
      })
    })
  })
})
