'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const uuid = require('uuid/v4')

const addressConnector = require('../../../../src/lib/connectors/crm-v2/addresses')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

experiment('lib/connectors/crm-v2/addresses', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra')
    sandbox.stub(serviceRequest, 'get')
    sandbox.stub(serviceRequest, 'post')
    sandbox.stub(serviceRequest, 'delete')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getAddress', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves({
        addressId: 'test-address-id'
      })

      response = await addressConnector.getAddress('test-address-id')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/addresses/test-address-id')
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal({
        addressId: 'test-address-id'
      })
    })
  })

  experiment('.createAddress', () => {
    let address
    let addressId
    let result

    beforeEach(async () => {
      addressId = uuid()
      address = { addressId }

      serviceRequest.post.resolves(address)
      result = await addressConnector.createAddress(address)
    })

    test('makes a post to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('http://test.defra/addresses')
    })

    test('passes the address to the post', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options).to.equal({ body: address })
    })

    test('returns the entity from the CRM', async () => {
      expect(result).to.equal(address)
    })
  })

  experiment('.deleteAddress', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves()

      await addressConnector.deleteAddress('test-address-id')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args
      expect(url).to.equal('http://test.defra/addresses/test-address-id')
    })
  })
})
