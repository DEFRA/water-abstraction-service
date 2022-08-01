const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const controller = require('../../../src/modules/change-email/controller')
const idm = require('../../../src/lib/connectors/idm')
const crmEntities = require('../../../src/lib/connectors/crm/entities')
const notifications = require('../../../src/lib/notifications/emails')
const { logger } = require('../../../src/logger')
const event = require('../../../src/lib/event')

const userId = 123
const email = 'mail@example.com'
const securityCode = '012987'
const entityId = 'entity_1'

experiment('change email controller', () => {
  const code = sandbox.stub()
  const h = { response: sandbox.stub().returns({ code }) }

  beforeEach(() => {
    sandbox.stub(idm, 'getEmailChangeStatus')
    sandbox.stub(idm, 'startEmailChange')
    sandbox.stub(idm, 'verifySecurityCode')
    sandbox.stub(idm.usersClient, 'findOneById')
    sandbox.stub(notifications, 'sendVerificationCodeEmail')
    sandbox.stub(notifications, 'sendEmailAddressInUseNotification')
    sandbox.stub(crmEntities, 'updateEntityEmail')
    sandbox.stub(logger, 'error')
    sandbox.stub(event, 'save')
  })

  afterEach(async () => sandbox.restore())

  experiment('getStatus', () => {
    const request = {
      params: {
        userId
      }
    }

    test('gets status of email change from IDM', async () => {
      await controller.getStatus(request, h)
      expect(idm.getEmailChangeStatus.calledWith(userId))
        .to.equal(true)
    })

    test('responds with result of IDM call', async () => {
      const response = {
        error: null,
        data: {
          userId
        }
      }
      idm.getEmailChangeStatus.resolves(response)
      const result = await controller.getStatus(request, h)
      expect(result).to.equal(response)
    })

    test('handles IDM error and responds with same code', async () => {
      idm.getEmailChangeStatus.rejects({
        statusCode: 404
      })
      await controller.getStatus(request, h)
      expect(code.calledWith(404)).to.equal(true)
    })

    test('throws non-http errors', async () => {
      idm.getEmailChangeStatus.rejects()
      const func = () => controller.getStatus(request, h)
      expect(func()).to.reject()
    })
  })

  experiment('postStartEmailAddressChange', () => {
    const request = {
      params: {
        userId
      },
      payload: {
        email
      }
    }
    const idmResponse = {
      error: null,
      data: {
        securityCode
      }
    }

    test('calls idm.startEmailChange with correct params', async () => {
      await controller.postStartEmailAddressChange(request, h)
      expect(idm.startEmailChange.calledWith(
        userId, email
      )).to.equal(true)
    })

    test('sends verification code email only', async () => {
      idm.startEmailChange.resolves(idmResponse)
      await controller.postStartEmailAddressChange(request, h)
      expect(notifications.sendVerificationCodeEmail.calledWith(
        email, securityCode
      )).to.equal(true)
      expect(notifications.sendEmailAddressInUseNotification.callCount)
        .to.equal(0)
    })

    test('resolves with IDM response', async () => {
      idm.startEmailChange.resolves(idmResponse)
      const result = await controller.postStartEmailAddressChange(request, h)
      expect(result).to.equal(idmResponse)
    })

    test('sends email address in use email only if conflict', async () => {
      idm.startEmailChange.rejects({
        statusCode: 409
      })
      await controller.postStartEmailAddressChange(request, h)
      expect(notifications.sendEmailAddressInUseNotification.calledWith(
        email
      )).to.equal(true)
      expect(notifications.sendVerificationCodeEmail.callCount).to.equal(0)
      expect(code.calledWith(409)).to.equal(true)
    })

    test('throws non-http errors', async () => {
      idm.startEmailChange.rejects()
      const func = () => controller.postStartEmailAddressChange(request, h)
      expect(func()).to.reject()
    })
  })

  experiment('postSecurityCode', () => {
    const request = {
      params: {
        userId
      },
      payload: {
        securityCode
      }
    }
    const idmUserResponse = {
      user_name: 'old@example.com',
      external_id: entityId
    }
    const idmVerifyResponse = {
      error: null,
      data: {
        email
      }
    }

    beforeEach(async () => {
      idm.usersClient.findOneById.resolves(idmUserResponse)
      idm.verifySecurityCode.resolves(idmVerifyResponse)
    })

    test('verifies security code with IDM', async () => {
      await controller.postSecurityCode(request, h)
      expect(idm.verifySecurityCode.calledWith(
        userId, securityCode
      )).to.equal(true)
    })

    test('updates CRM entity', async () => {
      await controller.postSecurityCode(request, h)
      expect(crmEntities.updateEntityEmail.calledWith(
        entityId, email
      )).to.equal(true)
    })

    test('logs event for audit', async () => {
      await controller.postSecurityCode(request, h)
      const e = event.save.lastCall.args[0]

      expect(e.type).to.equal('user-account')
      expect(e.subtype).to.equal('email-change')
      expect(e.issuer).to.equal('old@example.com')
      expect(e.entities).to.equal([entityId])
      expect(e.metadata).to.equal({
        oldEmail: 'old@example.com',
        newEmail: email,
        userId
      })
    })

    test('responds with event', async () => {
      const result = await controller.postSecurityCode(request, h)
      expect(result.error).to.equal(null)
      expect(result.data.eventId).to.be.a.string()
    })

    test('throws non-http errors', async () => {
      idm.usersClient.findOneById.rejects()
      const func = () => controller.postSecurityCode(request, h)
      expect(func()).to.reject()
    })
  })
})
