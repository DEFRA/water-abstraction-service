'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const nock = require('nock')

const { server, start } = require('../../index.js')
const { logger } = require('../../src/logger')
const scheduledNotificationsService = require('../../src/lib/services/scheduled-notifications')

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

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
    })

    experiment('when the request is invalid', () => {
      beforeEach(() => {
        sandbox.stub(scheduledNotificationsService, 'getScheduledNotificationByNotifyId').resolves(null)
      })

      test('we return a 404 response', async () => {
        const res = await server.inject(request)

        expect(res.statusCode).to.equal(404)
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
    })
  })

  test('The API should throw an error when personalisation is not supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
      payload: {
        recipient: 'test@test.com'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    }
    const res = await server.inject(request)
    expect(res.statusCode).to.equal(400)
  })

  // Send email notification
  test('The API should throw an error when an invalid template id is supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/template_doesnt_exist',
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

    const res = await server.inject(request)
    expect(res.statusCode).to.equal(400)
  })

  // Send email notification
  test('The API should throw an error when a template id that is missing in notify is supplied', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_missing_in_notify',
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

    const res = await server.inject(request)
    expect(res.statusCode).to.equal(400)
  })

  // Send email notification
  test('The API should throw an error when personalisation params are missing', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
      payload: {
        recipient: 'test@test.com'
      },
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    }

    const res = await server.inject(request)

    expect(res.statusCode).to.equal(400)
  })

  // Send email notification
  test('The API should not throw an error when valid email address specified for message of type email', async () => {
    const request = {
      method: 'POST',
      url: '/water/1.0/notify/unit_test_email',
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

    const res = await server.inject(request)

    expect(res.statusCode).to.equal(200)
  })
  experiment('Test sending a SMS notification', () => {
    // Send email notification
    test('The API should not throw an error when valid number specified for message of type sms', async () => {
      const request = {
        method: 'POST',
        url: '/water/1.0/notify/unit_test_sms',
        payload: {
          recipient: '+447446880860',
          personalisation: {
            test_value: '00/00/00/00'
          }
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }

      const res = await server.inject(request)
      expect(res.statusCode).to.equal(200)
    })
  })

  experiment('Test sending a Postal notification', () => {
    // Send letter notification
    test('The API should not throw an error when valid address specified for message of type letter', async () => {
      const request = {
        method: 'POST',
        url: '/water/1.0/notify/unit_test_letter',
        payload: {
          recipient: 'insert name',
          personalisation: {
            address_line_1: 'The Occupier', // required
            address_line_2: '123 High Street', // required
            address_line_3: 'London',
            postcode: 'SW14 6BH', // required
            test_value: '00/00/00/00'
          }
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }

      const res = await server.inject(request)

      expect(res.statusCode).to.equal(200)
    })
  })

  // futureSend
  experiment('Scheduled notifications', () => {
  // Send email notification
    test('The API should not throw an error when scheduling a message', async () => {
      const request = {
        method: 'POST',
        url: '/water/1.0/notifyLater/unit_test_email',
        payload: {
          id: '11111111-1111-1111-1111-111111111111',
          recipient: 'test@test.com',
          personalisation: {
            test_value: '00/00/00/00'
          },
          sendafter: '2018-01-01'
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }

      const res = await server.inject(request)

      expect(res.statusCode).to.equal(200)
    })

    test('The API should throw an error when invalid date is supplied when scheduling a message', async () => {
      const request = {
        method: 'POST',
        url: '/water/1.0/notifyLater/unit_test_email',
        payload: {
          id: '11111111-1111-1111-1111-111111111111',
          personalisation: {
            test_value: '00/00/00/00'
          },
          sendafter: 'x2018-01-01'
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }

      nock.recorder.rec()

      const res = await server.inject(request)

      expect(res.statusCode).to.equal(400)
    })

    test('The API should throw an error when database throws an error', async () => {
      const request = {
        method: 'POST',
        url: '/water/1.0/notifyLater/unit_test_email',
        payload: {
          id: 'unit-test-notification-b',
          recipient: 'test@test.com',
          personalisation: {
            test_value: '00/00/00/00'
          },
          sendafter: '2018x-01-01'
        },
        headers: {
          Authorization: process.env.JWT_TOKEN
        }
      }
      const res = await server.inject(request)
      expect(res.statusCode).to.equal(400)
    })
  })
})
