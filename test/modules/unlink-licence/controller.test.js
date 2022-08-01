const { beforeEach, afterEach, experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const controller = require('../../../src/modules/unlink-licence/controller')
const crmDocumentsConnector = require('../../../src/lib/connectors/crm/documents')
const idmConnector = require('../../../src/lib/connectors/idm')
const Boom = require('@hapi/boom')
const event = require('../../../src/lib/event')
const { logger } = require('../../../src/logger')

const callingUserId = 123
const documentId = 'doc-id'

const request = {
  params: {
    documentId
  },
  payload: {
    callingUserId
  }
}
const codeSpy = sandbox.spy()
const h = {
  response: sandbox.stub().returns({ code: codeSpy })
}

const user = {
  user_id: 123,
  user_name: 'test@example.com',
  roles: ['unlink_licences']
}

const document = {
  document_id: documentId
}

experiment('modules/unlink-licence/controller', () => {
  beforeEach(async () => {
    sandbox.stub(crmDocumentsConnector, 'updateMany').resolves({ data: document, rowCount: 1 })
    sandbox.stub(idmConnector.usersClient, 'findOneById').resolves(user)
    sandbox.stub(event, 'create')
    sandbox.stub(event, 'save')
    sandbox.stub(logger, 'error')
  })

  afterEach(async () => { sandbox.restore() })

  experiment('.patchUnlinkLicence', () => {
    experiment('when rowCount === 1', () => {
      test('calls h.response with the document data & 200 status code', async () => {
        await controller.patchUnlinkLicence(request, h)
        expect(h.response.calledWith({ data: document, error: null })).to.be.true()
        expect(codeSpy.calledWith(200)).to.be.true()
      })
    })

    experiment('when rowCount === 0', () => {
      test('calls h.response with the document data & 202 status code', async () => {
        crmDocumentsConnector.updateMany.resolves({ data: [], rowCount: 0 })
        await controller.patchUnlinkLicence(request, h)
        expect(h.response.calledWith({ data: [], error: null })).to.be.true()
        expect(codeSpy.calledWith(202)).to.be.true()
      })
    })

    experiment('when an error is thrown', () => {
      test('calls logger.error if error is thrown', async () => {
        crmDocumentsConnector.updateMany.throws(Boom.teapot('bad error'))
        await controller.patchUnlinkLicence(request, h)
        const [{ error: thrownError }] = h.response.lastCall.args
        const [message, err, body] = logger.error.lastCall.args
        expect(message).to.equal('Failed to unlink licence')
        expect(err).to.equal(thrownError)
        expect(body).to.equal({ callingUserId, documentId: request.params.documentId })
      })

      test('returns error if isBoom', async () => {
        crmDocumentsConnector.updateMany.throws(Boom.teapot('bad error'))
        await controller.patchUnlinkLicence(request, h)
        const [{ error: thrownError }] = h.response.lastCall.args
        expect(h.response.calledWith({ data: null, error: thrownError })).to.true()
        expect(codeSpy.calledWith(418)).to.true()
        expect(thrownError.isBoom).to.be.true()
      })

      test('throws error if is not Boom', async () => {
        crmDocumentsConnector.updateMany.throws('not a Boom error')
        try {
          await controller.patchUnlinkLicence(request, h)
        } catch (err) {
          expect(err).to.be.an.error()
          expect(err.isBoom).to.be.undefined()
        }
      })
    })
  })

  experiment('.getCallingUser', () => {
    test('calls idmConnector.usersClient.findOneById with callingUserId', async () => {
      await controller.getCallingUser(callingUserId)
      expect(idmConnector.usersClient.findOneById.calledWith(callingUserId)).to.be.true()
    })

    test('returns the user', async () => {
      const result = await controller.getCallingUser(callingUserId)
      expect(result).to.equal(user)
    })

    test('throws Boom.forbidden error if user not authorised', async () => {
      const unauthorisedUser = user
      unauthorisedUser.roles = ['unauthorised']
      idmConnector.usersClient.findOneById.resolves(unauthorisedUser)
      try {
        await controller.getCallingUser(callingUserId)
      } catch (err) {
        expect(err.isBoom).to.be.true()
        expect(err.output.statusCode).to.equal(403)
      }
    })
  })

  experiment('.createUnlinkLicenceEvent', () => {
    test('calls event.create with expected arguments', async () => {
      await controller.createUnlinkLicenceEvent(user, documentId)
      expect(event.create.calledWith({
        type: 'unlink-licence',
        issuer: user.user_name,
        metadata: {
          documentId
        }
      })).to.be.true()
    })

    test('calls event.save with result of event.create', async () => {
      const eventData = { type: 'event-type', issuer: user.user_name, metadata: { some: 'data' } }
      event.create.returns(eventData)
      await controller.createUnlinkLicenceEvent(user, document)
      expect(event.save.calledWith(eventData)).to.be.true()
    })
  })

  experiment('.unlinkLicenceInCRM', () => {
    test('calls crmDocumentsConnector.updateMandy with correct arguments', async () => {
      await controller.unlinkLicenceInCRM(documentId)
      const filter = { document_id: documentId, company_entity_id: { $ne: null } }
      const body = { company_entity_id: null, verification_id: null, document_name: null }
      expect(crmDocumentsConnector.updateMany.calledWith(filter, body)).to.be.true()
    })
  })
})
