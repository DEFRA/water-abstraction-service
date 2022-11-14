'use strict'

const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const testHelpers = require('../../../test-helpers')
const routes = require('../../../../src/modules/licences/routes/charge-versions')

experiment('modules/licences/routes/charge-versions', () => {
  experiment('.getChargeVersionsByLicence', () => {
    let server

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getChargeVersionsByLicence)
    })

    test('validates the licence id must be a uuid', async () => {
      const url = '/water/1.0/licences/not-a-valid-id/charge-versions'
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(400)
    })

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/licences/${uuid()}/charge-versions`
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(200)
    })
  })
})
