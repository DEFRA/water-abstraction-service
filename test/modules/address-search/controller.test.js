'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const controller = require('../../../src/modules/address-search/controller')

const addressService = require('../../../src/modules/address-search/services/address-service')

experiment('modules/application-state/controller', () => {
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getAddressSearch', () => {
    let request, result

    beforeEach(async () => {
      request = {
        query: { q: 'TT1 1TT' }
      }
      sandbox.stub(addressService, 'getAddressesByPostcode').resolvesArg(0)
      result = await controller.getAddressSearch(request)
    })

    test('returns the data', async () => {
      expect(result).to.equal('TT1 1TT')
    })
  })
})
