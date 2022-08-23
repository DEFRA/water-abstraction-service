'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const { bookshelf } = require('../../../src/lib/connectors/bookshelf')
const users = require('../../../src/modules/acceptance-tests/lib/users')
const entities = require('../../../src/modules/acceptance-tests/lib/entities')
const chargeVersionWorkflows = require('../../../src/modules/acceptance-tests/lib/charge-version-workflows')
const permits = require('../../../src/modules/acceptance-tests/lib/permits')
const documents = require('../../../src/modules/acceptance-tests/lib/documents')
const events = require('../../../src/modules/acceptance-tests/lib/events')
const sessions = require('../../../src/modules/acceptance-tests/lib/sessions')
const notifications = require('../../../src/modules/acceptance-tests/lib/notifications')
const returnRequirements = require('../../../src/modules/acceptance-tests/lib/return-requirements')
const billing = require('../../../src/modules/acceptance-tests/lib/billing')
const gaugingStations = require('../../../src/modules/acceptance-tests/lib/gauging-stations')
const chargeVersions = require('../../../src/modules/acceptance-tests/lib/charge-versions')
const licenceAgreements = require('../../../src/modules/acceptance-tests/lib/licence-agreements')
const setLoader = require('../../../integration-tests/billing/services/loader')
const crmConnector = require('../../../src/modules/acceptance-tests/lib/connectors/crm')
const returnsConnector = require('../../../src/modules/acceptance-tests/lib/connectors/returns')
const controller = require('../../../src/modules/acceptance-tests/controller')
const cmConnector = require('../../../src/lib/connectors/charge-module/bill-runs')
const queueManager = require('../../../src/lib/queue-manager')
experiment('modules/acceptance-tests/controller', () => {
  let knexStub, queue
  beforeEach(async () => {
    knexStub = {
      where: sandbox.stub().returnsThis(),
      del: sandbox.stub(),
      raw: sandbox.stub()
    }
    queue = { deleteKeysByPattern: sandbox.stub() }

    sandbox.stub(bookshelf, 'knex').returns(knexStub)
    sandbox.stub(queueManager, 'getQueueManager').returns(queue)
    sandbox.stub(billing, 'tearDown')
    sandbox.stub(gaugingStations, 'tearDown')
    sandbox.stub(chargeVersions, 'tearDown')
    sandbox.stub(returnRequirements, 'tearDown')
    sandbox.stub(licenceAgreements, 'tearDown')
    sandbox.stub(crmConnector, 'tearDown')
    sandbox.stub(returnsConnector, 'tearDown')
    sandbox.stub(cmConnector, 'delete')
    sandbox.stub(notifications, 'delete').resolves()
    sandbox.stub(events, 'delete').resolves()
    sandbox.stub(permits, 'delete').resolves()
    sandbox.stub(entities, 'delete').resolves()
    sandbox.stub(documents, 'delete').resolves()
    sandbox.stub(users, 'delete').resolves()
    sandbox.stub(sessions, 'delete').resolves()
    sandbox.stub(chargeVersionWorkflows, 'delete').resolves()

    sandbox.stub(setLoader, 'createSetLoader')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('postSetupFromYaml', () => {
    experiment('invalid key', () => {
      let h, request, response
      const invalidkey = 'some-invalid-key'
      beforeEach(async () => {
        h = {
          response: sandbox.stub().returnsThis(),
          code: sandbox.stub()
        }

        request = {
          params: { key: invalidkey }
        }

        response = await controller.postSetupFromYaml(request, h)
      })
      test('returns Boom error', async () => {
        expect(response.isBoom).to.be.true()
        expect(response.output.payload.statusCode).to.equal(404)
        expect(response.output.payload.message).to.equal(`Key ${invalidkey} did not match any available Yaml sets.`)
      })
    })

    experiment('valid key', () => {
      let h, request, loaderStub
      const validKey = 'barebones'
      beforeEach(async () => {
        loaderStub = {
          load: sandbox.stub()
        }

        setLoader.createSetLoader.returns(loaderStub)

        h = {
          response: sandbox.stub().returnsThis(),
          code: sandbox.stub()
        }

        request = {
          params: { key: validKey }
        }

        await controller.postSetupFromYaml(request, h)
      })

      test('creates a set loader', async () => {
        expect(setLoader.createSetLoader.callCount).to.equal(1)
      })

      test('calls load to load the YAML files', async () => {
        expect(loaderStub.load.called).to.be.true()
      })

      test('responds with 204 status code', async () => {
        expect(h.code.calledWith(204)).to.be.true()
      })
    })
  })

  experiment('postTearDown', () => {
    test('deletes the test data that has been created', async () => {
      await controller.postTearDown()
      expect(billing.tearDown.called).to.be.true()
      expect(gaugingStations.tearDown.called).to.be.true()
      expect(chargeVersions.tearDown.called).to.be.true()
      expect(returnRequirements.tearDown.called).to.be.true()
      expect(licenceAgreements.tearDown.called).to.be.true()
      expect(crmConnector.tearDown.called).to.be.true()
      expect(returnsConnector.tearDown.called).to.be.true()
      expect(queueManager.getQueueManager().deleteKeysByPattern.called).to.be.true()
      expect(notifications.delete.called).to.be.true()
      expect(events.delete.called).to.be.true()
      expect(permits.delete.called).to.be.true()
      expect(entities.delete.called).to.be.true()
      expect(documents.delete.called).to.be.true()
      expect(users.delete.called).to.be.true()
      expect(sessions.delete.called).to.be.true()
      expect(chargeVersionWorkflows.delete.called).to.be.true()
    })
  })
})
