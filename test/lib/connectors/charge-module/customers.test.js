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
const { v4: uuid } = require('uuid')

const gotCM = require('../../../../src/lib/connectors/charge-module/lib/got-cm')
const customerApiConnector = require('../../../../src/lib/connectors/charge-module/customers')

experiment('lib/connectors/charge-module/customers', () => {
  const tempInvoiceAccountId = uuid()

  beforeEach(async () => {
    sandbox.stub(gotCM, 'post').resolves()
    sandbox.stub(gotCM, 'get').resolves()
  })
  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.updateCustomer', () => {
    beforeEach(async () => {
      await customerApiConnector.updateCustomer(tempInvoiceAccountId)
    })

    test('the method is POST', async () => {
      expect(gotCM.post.called).to.be.true()
    })

    test('the payload is equal to the resolved object from the mapInvoiceAccountToChargeModuleCustomer function', async () => {
      const [, options] = gotCM.post.lastCall.args
      expect(options).to.equal({ json: tempInvoiceAccountId })
    })
  })

  experiment('.getCustomerFiles', () => {
    beforeEach(async () => {
      await customerApiConnector.getCustomerFiles()
    })

    test('the method is GET', async () => {
      expect(gotCM.get.called).to.be.true()
    })
  })
})
