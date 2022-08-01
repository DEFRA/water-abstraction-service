'use strict'

const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const testHelpers = require('../../../test-helpers')
const routes = require('../../../../src/modules/licences/routes/invoices')
const controllers = require('../../../../src/modules/licences/controllers/invoices')

experiment('modules/licences/routes/invoices', () => {
  experiment('.getLicenceInvoices', () => {
    let server

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceInvoices)
    })

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/invoices'
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(400)
    })

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}/invoices`
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(200)
    })

    test('has the right controller', async () => {
      expect(routes.getLicenceInvoices.handler).to.equal(controllers.getLicenceInvoices)
    })

    test('has the right method', async () => {
      expect(routes.getLicenceInvoices.method).to.equal('GET')
    })
  })
})
