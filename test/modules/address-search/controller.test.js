'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const Address = require('../../../src/lib/models/address')
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
      sandbox.stub(addressService, 'getAddressesByPostcode').resolves({
        data: [
          new Address()
        ]
      })
      result = await controller.getAddressSearch(request)
    })

    test('fetches the data via the server method', async () => {
      expect(addressService.getAddressesByPostcode.calledWith('TT1 1TT')).to.be.true()
    })

    test('returns the data', async () => {
      console.log(result)
      expect(result.data).to.be.an.array().length(1)
      expect(result.data[0] instanceof Address).to.be.true()
    })
  })
})
