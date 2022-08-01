'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')

const routes = require('../../../src/modules/reporting/routes')
const testHelpers = require('../../test-helpers')

const { ROLES: { billing } } = require('../../../src/lib/roles')

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

experiment('modules/reporting/routes', () => {
  let server

  experiment('.getReport', () => {
    let request

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getReport, true)
      request = makeGet('/water/1.0/report/billedActiveLicencesReport')
    })

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(403)
    })

    test('http 200 OK when user has billing scope', async () => {
      request.auth.credentials.scope = [billing]
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [billing]
      request.headers['defra-internal-user-id'] = 'invalid'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 400 bad request when the report identifier is invalid', async () => {
      request.auth.credentials.scope = [billing]
      request.url = '/water/1.0/report/notAValidReport'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('http 200 OK when the report identifier is valid', async () => {
      request.auth.credentials.scope = [billing]
      request.url = '/water/1.0/report/billedActiveLicencesReport'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })
  })
})
