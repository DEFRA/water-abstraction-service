'use strict'

const Hapi = require('@hapi/hapi')

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const sandbox = require('sinon').createSandbox()

const routes = require('../../../src/modules/contacts/routes')
const controller = require('../../../src/modules/contacts/controller')

/**
 * Creates a test Hapi server that has no other plugins loaded,
 * does not require auth and will rewrite the handler function to
 * return a test stub.
 *
 * This allows the route validation to be tested in isolation.
 *
 * @param {Object} route The route to test
 */
const getServer = route => {
  const server = Hapi.server({ port: 80 })

  const testRoute = { ...route }
  testRoute.handler = (req, h) => h.response('Test handler').code(200)
  testRoute.config.pre = []
  server.route(testRoute)
  return server
}

const createRequest = () => ({
  method: 'POST',
  url: '/water/1.0/contacts',
  headers: {
    'defra-internal-user-id': 1234
  },
  payload: {
    type: 'person',
    salutation: 'Mr',
    firstName: 'Johnny',
    lastName: 'Test',
    middleInitials: 'T',
    department: 'Test Department',
    suffix: 'MBE',
    isTest: true,
    source: 'nald'
  }
})

experiment('modules/contacts/routes', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('postContact', () => {
    let server, request

    beforeEach(async () => {
      server = getServer(routes.postContact)
      request = createRequest()
    })

    test('the correct handler is specified', async () => {
      expect(routes.postContact.handler)
        .to.equal(controller.postContact)
    })

    test('type can be "person"', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('type can be "department"', async () => {
      request.payload.type = 'department'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('requires type', async () => {
      delete request.payload.type
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('salutation is optional', async () => {
      delete request.payload.salutation
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('firstName is optional', async () => {
      delete request.payload.firstName
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('lastName is optional', async () => {
      delete request.payload.lastName
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('middleInitials is optional', async () => {
      delete request.payload.middleInitials
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('department is optional', async () => {
      delete request.payload.department
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('suffix is optional', async () => {
      delete request.payload.suffix
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('isTest is optional (but will default to false)', async () => {
      delete request.payload.isTest
      const response = await server.inject(request)

      expect(response.statusCode).to.equal(200)
      expect(response.request.payload.isTest).to.equal(false)
    })

    test('source is optional (but will default to "wrls")', async () => {
      delete request.payload.source
      const response = await server.inject(request)

      expect(response.statusCode).to.equal(200)
      expect(response.request.payload.source).to.equal('wrls')
    })

    test('returns a 400 if the calling user id is not supplied', async () => {
      request.headers = {}
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 if the calling user id is not a number', async () => {
      request.headers['defra-internal-user-id'] = 'a string'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })
  })
})
