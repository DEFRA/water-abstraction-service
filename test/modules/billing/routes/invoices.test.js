'use strict'
const { v4: uuid } = require('uuid')

const { expect } = require('@hapi/code')
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script()

const routes = require('../../../../src/modules/billing/routes/invoices')
const testHelpers = require('../../../test-helpers')
const { ROLES } = require('../../../../src/lib/roles')

/**
 * Creates a test Hapi server that has no other plugins loaded,
 * does not require auth and will rewrite the handler function to
 * return a test stub.
 *
 * This allows the route validation to be tested in isolation.
 *
 * @param {Object} route The route to test
 */
const getServer = route =>
  testHelpers.createServerForRoute(route, true)

experiment('modules/billing/routes', () => {
  let auth

  beforeEach(async () => {
    auth = {
      strategy: 'basic',
      credentials: {
        scope: [ROLES.billing]
      }
    }
  })

  experiment('postCreateBatch', () => {
    let request
    let server

    beforeEach(async () => {
      server = await getServer(routes.patchInvoice)

      request = {
        method: 'PATCH',
        url: `/water/1.0/billing/invoices/${uuid()}`,
        payload: {
          isFlaggedForRebilling: true
        },
        auth
      }
    })

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(200)
    })

    test('returns a 400 if the invoiceId is not a valid guid', async () => {
      request.url = '/water/1.0/billing/invoices/test-id'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 if the isFlaggedForRebilling is omitted', async () => {
      delete request.payload.isFlaggedForRebilling
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })

    test('returns a 400 if the isFlaggedForRebilling is an unexpected value', async () => {
      request.payload.isFlaggedForRebilling = 'a string'
      const response = await server.inject(request)
      expect(response.statusCode).to.equal(400)
    })
  })
})
