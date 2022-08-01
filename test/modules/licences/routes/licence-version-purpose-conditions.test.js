'use strict'

const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const testHelpers = require('../../../test-helpers')
const routes = require('../../../../src/modules/licences/routes/licence-version-purpose-conditions')

experiment('modules/licences/routes/licence-version-purpose-conditions', () => {
  experiment('.getLicenceVersionPurposeConditions', () => {
    let server

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicenceVersionPurposeConditions)
    })

    test('validates the LVPC id must be a uuid', async () => {
      const url = '/water/1.0/licence-version-purpose-conditions/not-a-valid-id'
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(400)
    })

    test('allows a valid uuid for the LVPC ID for date', async () => {
      const url = `/water/1.0/licence-version-purpose-conditions/${uuid()}`
      const output = await server.inject(url)
      expect(output.statusCode).to.equal(200)
    })
  })
})
