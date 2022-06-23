'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const uuid = require('uuid/v4')
const { expect } = require('@hapi/code')

const routes = require('../../../../src/modules/charge-versions/routes/charge-version-workflows')
const testHelpers = require('../../../test-helpers')
const preHandlers = require('../../../../src/modules/charge-versions/controllers/pre-handlers')

const { ROLES: { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } } = require('../../../../src/lib/roles')

const makeRequest = (method, url) => ({
  method,
  url,
  auth: {
    strategy: 'basic',
    credentials: {
      scope: []
    }
  },
  headers: {
    'defra-internal-user-id': 123
  }
})

const makeGet = url => makeRequest('get', url)
const makePost = url => makeRequest('post', url)
const makePatch = url => makeRequest('patch', url)
const makeDelete = url => makeRequest('delete', url)

experiment('modules/charge-versions/routes/charge-version-workflows', () => {
  let server
  let id

  experiment('.getChargeVersionWorkflows', () => {
    let request

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getChargeVersionWorkflows, true)
      request = makeGet('/water/1.0/charge-version-workflows')
    })

    test('numeric paging parameters working for chargeVersionWorkflowReviewer', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.url = '/water/1.0/charge-version-workflows?page=1&perPage=10&tabFilter=review'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('non-numberic paging parameters rejected', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.url = '/water/1.0/charge-version-workflows?page=abc&perPage=abc&tabFilter=review'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the licence id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      request.url = '/water/1.0/charge-version-workflows?licenceId=not-a-guid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 200 OK when the licence id is valid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      request.url = `/water/1.0/charge-version-workflows?licenceId=${uuid()}`
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })
  })

  experiment('.getChargeVersionWorkflow', () => {
    let request

    beforeEach(async () => {
      id = uuid()
      server = await testHelpers.createServerForRoute(routes.getChargeVersionWorkflow, true)
      request = makeGet(`/water/1.0/charge-version-workflows/${id}`)
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })
  })

  experiment('.postChargeVersionWorkflow', () => {
    let request

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.postChargeVersionWorkflow, true)

      request = makePost('/water/1.0/charge-version-workflows')
      request.payload = {
        licenceId: uuid(),
        chargeVersion: {
          dateRange: {
            startDate: '2019-01-01'
          }
        }
      }
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the licence ID is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.payload.licenceId = 'not-a-guid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the charge version data is not an object', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.payload.chargeVersion = 'not-an-object'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('contains a pre handler to map the charge version', async () => {
      const { pre } = routes.postChargeVersionWorkflow.options
      expect(pre[0].method).to.equal(preHandlers.mapChargeVersion)
      expect(pre[0].assign).to.equal('chargeVersion')
    })

    test('contains a pre handler to map the internal calling user', async () => {
      const { pre } = routes.postChargeVersionWorkflow.options
      expect(pre[1].method).to.equal(preHandlers.mapInternalCallingUser)
      expect(pre[1].assign).to.equal('user')
    })
  })

  experiment('.patchChargeVersionWorkflow', () => {
    let request

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.patchChargeVersionWorkflow, true)

      id = uuid()
      request = makePatch(`/water/1.0/charge-version-workflows/${id}`)
      request.payload = {
        status: 'review',
        approverComments: 'Good work'
      }
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the licence ID is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.payload.licenceId = 'not-a-guid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the charge version data is not an object', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.payload.chargeVersion = 'not-an-object'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('contains a pre handler to map the charge version', async () => {
      const { pre } = routes.patchChargeVersionWorkflow.options
      expect(pre).to.have.length(1)
      expect(pre[0].method).to.equal(preHandlers.mapChargeVersion)
      expect(pre[0].assign).to.equal('chargeVersion')
    })
  })

  experiment('.deleteChargeVersionWorkflow', () => {
    let request

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.deleteChargeVersionWorkflow, true)

      id = uuid()
      request = makeDelete(`/water/1.0/charge-version-workflows/${id}`)
    })

    test('http 400 bad request when the charge version workflow ID is invalid', async () => {
      request = makeDelete('/water/1.0/charge-version-workflows/not-a-guid')
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('contains a pre handler to load the charge version workflow', async () => {
      const { pre } = routes.deleteChargeVersionWorkflow.options
      expect(pre).to.have.length(1)
      expect(pre[0].method).to.equal(preHandlers.loadChargeVersionWorkflow)
      expect(pre[0].assign).to.equal('chargeVersionWorkflow')
    })
  })
})
