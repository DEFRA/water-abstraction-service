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

const invoiceAccountConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

experiment('lib/connectors/crm-v2/invoice-accounts', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra')
    sandbox.stub(serviceRequest, 'get').resolves()
    sandbox.stub(serviceRequest, 'post')
    sandbox.stub(serviceRequest, 'delete')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getInvoiceAccountsByIds', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves([
        { invoiceAccountId: 'test-id-1' },
        { invoiceAccountId: 'test-id-2' }
      ])

      response = await invoiceAccountConnector.getInvoiceAccountsByIds([
        'test-id-1',
        'test-id-2'
      ])
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-accounts')
    })

    test('adds the invoice account ids to the query string', async () => {
      const [, options] = serviceRequest.get.lastCall.args
      expect(options.qs.id).to.equal([
        'test-id-1',
        'test-id-2'
      ])
    })

    test('sets the querystring options to allow repeating params', async () => {
      const [, options] = serviceRequest.get.lastCall.args
      expect(options.qsStringifyOptions.arrayFormat).to.equal('repeat')
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal([
        { invoiceAccountId: 'test-id-1' },
        { invoiceAccountId: 'test-id-2' }
      ])
    })
  })

  experiment('.getInvoiceAccountById', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves({ invoiceAccountId: 'test-id-1' })
      response = await invoiceAccountConnector.getInvoiceAccountById('test-id-1')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-accounts/test-id-1')
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal({ invoiceAccountId: 'test-id-1' })
    })
  })

  experiment('.createInvoiceAccount', () => {
    let invoiceAccount
    let invoiceAccountId
    let createdInvoiceAccount
    let result

    beforeEach(async () => {
      invoiceAccountId = uuid()
      invoiceAccount = {
        invoiceAccountNumber: '1234abcd'
      }
      createdInvoiceAccount = { invoiceAccountId, ...invoiceAccount }
      serviceRequest.post.resolves(createdInvoiceAccount)
      result = await invoiceAccountConnector.createInvoiceAccount(invoiceAccount)
    })

    test('makes a post request to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-accounts')
    })

    test('passes the invoice account in the body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal(invoiceAccount)
    })

    test('returns the created entity', async () => {
      expect(result).to.equal(createdInvoiceAccount)
    })
  })

  experiment('.deleteInvoiceAccount', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves()

      await invoiceAccountConnector.deleteInvoiceAccount('test-invoice-account-id')
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-accounts/test-invoice-account-id')
    })
  })

  experiment('.createInvoiceAccountAddress', () => {
    let invoiceAccountId
    let invoiceAccountAddress
    let invoiceAccountAddressId
    let createdInvoiceAccountAddress
    let result

    beforeEach(async () => {
      invoiceAccountId = uuid()
      invoiceAccountAddressId = uuid()
      invoiceAccountAddress = {
        addressId: uuid()
      }
      createdInvoiceAccountAddress = {
        invoiceAccountAddressId,
        ...invoiceAccountAddress
      }

      serviceRequest.post.resolves(createdInvoiceAccountAddress)
      result = await invoiceAccountConnector.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress)
    })

    test('makes a post request to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal(`http://test.defra/invoice-accounts/${invoiceAccountId}/addresses`)
    })

    test('passes the invoice account address in the body', async () => {
      const [, options] = serviceRequest.post.lastCall.args
      expect(options.body).to.equal(invoiceAccountAddress)
    })

    test('returns the created entity', async () => {
      expect(result).to.equal(createdInvoiceAccountAddress)
    })
  })

  experiment('fetchInvoiceAccountsWithUpdatedEntities', () => {
    const ref = 'Y00000000A'
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves({ invoiceAccountId: 'test-id-1' })
      response = await invoiceAccountConnector.getInvoiceAccountByRef(ref)
    })

    test('makes a request to the expected URL', async () => {
      const [url, qs] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-account')
      expect(qs).to.equal({ qs: { ref } })
    })

    test('returns the result from the crm', async () => {
      expect(response).to.equal({ invoiceAccountId: 'test-id-1' })
    })
  })

  experiment('updateInvoiceAccountsWithCustomerFileReference', () => {
    const fileRef = 'SomeFile'
    const exportedAt = '2010-10-10'
    const exportedCustomers = ['cus1', 'cus2']

    beforeEach(async () => {
      serviceRequest.post.resolves()
      await invoiceAccountConnector.updateInvoiceAccountsWithCustomerFileReference(fileRef, exportedAt, exportedCustomers)
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.equal('http://test.defra/invoice-accounts/customer-file-references')
    })
  })
})
