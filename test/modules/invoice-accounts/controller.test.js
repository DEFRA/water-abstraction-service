'use strict'

const { expect } = require('@hapi/code')
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script()

const controller = require('../../../src/modules/invoice-accounts/controller')
const invoiceAccountService = require('../../../src/lib/services/invoice-accounts-service')
const invoiceService = require('../../../src/lib/services/invoice-service')
const InvoiceAccount = require('../../../src/lib/models/invoice-account')
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address')

const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

experiment('modules/invoice-accounts/controller', () => {
  let h, responseStub

  beforeEach(async () => {
    responseStub = {
      code: sandbox.stub()
    }
    h = {
      response: sandbox.stub().returns(responseStub)
    }
    sandbox.stub(invoiceAccountService, 'getByInvoiceAccountId')
    sandbox.stub(invoiceAccountService, 'createInvoiceAccountAddress')
    sandbox.stub(invoiceService, 'getInvoicesForInvoiceAccount').resolves({ foo: 'bar' })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getInvoiceAccount', () => {
    let request, result

    beforeEach(async () => {
      request = {
        params: {
          invoiceAccountId: 'test-id'
        }
      }
    })
    experiment('when the invoice account exists', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(new InvoiceAccount())
        result = await controller.getInvoiceAccount(request)
      })

      test('the invoice account ID is passed to the service', async () => {
        expect(invoiceAccountService.getByInvoiceAccountId.calledWith('test-id')).to.be.true()
      })

      test('resolves with an invoice account model', async () => {
        expect(result instanceof InvoiceAccount).to.be.true()
      })
    })

    experiment('when the invoice account does not exist', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(null)
        result = await controller.getInvoiceAccount(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })

  experiment('.postInvoiceAccountAddress', () => {
    const invoiceAccountId = uuid()

    const address = {
      addressLine1: 'Test Farm',
      addressLine2: 'Test Lane',
      addressLine3: 'Test Forest',
      addressLine4: 'Little Testington',
      town: 'Testington',
      county: 'Testingshire',
      postcode: 'TT1 1TT',
      country: 'United Kingdom'
    }

    const request = {
      params: {
        invoiceAccountId
      },
      payload: {
        address,
        agentCompany: null,
        contact: null
      }
    }

    const refDate = '2021-01-01'

    const createdModel = {
      id: uuid()
    }

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        invoiceAccountService.createInvoiceAccountAddress.resolves(createdModel)
        await controller.postInvoiceAccountAddress(request, h, refDate)
      })

      test('the service method is called', async () => {
        const [id, model] = invoiceAccountService.createInvoiceAccountAddress.lastCall.args
        expect(id).to.equal(invoiceAccountId)
        expect(model).to.be.an.instanceOf(InvoiceAccountAddress)
      })

      test('the date range is correctly mapped to the model', async () => {
        const [, { dateRange }] = invoiceAccountService.createInvoiceAccountAddress.lastCall.args
        expect(dateRange.startDate).to.equal(refDate)
        expect(dateRange.endDate).to.be.null()
      })

      test('the address is correctly mapped to the model', async () => {
        const [, model] = invoiceAccountService.createInvoiceAccountAddress.lastCall.args
        expect(model.address.addressLine1).to.equal(address.addressLine1)
        expect(model.address.addressLine2).to.equal(address.addressLine2)
        expect(model.address.addressLine3).to.equal(address.addressLine3)
        expect(model.address.addressLine4).to.equal(address.addressLine4)
        expect(model.address.town).to.equal(address.town)
        expect(model.address.county).to.equal(address.county)
        expect(model.address.postcode).to.equal(address.postcode)
        expect(model.address.country).to.equal(address.country)
      })

      test('the agent company is correctly mapped to the model', async () => {
        const [, model] = invoiceAccountService.createInvoiceAccountAddress.lastCall.args
        expect(model.agentCompany).to.be.null()
      })

      test('the contact company is correctly mapped to the model', async () => {
        const [, model] = invoiceAccountService.createInvoiceAccountAddress.lastCall.args
        expect(model.contact).to.be.null()
      })

      test('the response body is the created model', async () => {
        expect(h.response.calledWith(createdModel)).to.be.true()
      })

      test('the response code is 201', async () => {
        expect(responseStub.code.calledWith(201)).to.be.true()
      })
    })

    experiment('when there is an error', () => {
      const err = new Error('oops')

      beforeEach(async () => {
        invoiceAccountService.createInvoiceAccountAddress.rejects(err)
      })

      test('the error is rethrown', async () => {
        const func = () => controller.postInvoiceAccountAddress(request, h, refDate)
        const response = await expect(func()).to.reject()
        expect(response).to.equal(err)
      })
    })
  })

  experiment('.getInvoices', () => {
    let request, result

    beforeEach(async () => {
      request = {
        params: {
          invoiceAccountId: 'test-id'
        },
        query: {
          page: 2,
          perPage: 10
        }
      }
    })

    experiment('when the invoice account does not exist', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(null)
        result = await controller.getInvoices(request)
      })

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true()
        expect(result.output.statusCode).to.equal(404)
      })
    })

    experiment('when the invoice account exists', () => {
      beforeEach(async () => {
        invoiceAccountService.getByInvoiceAccountId.resolves(new InvoiceAccount())
        result = await controller.getInvoices(request)
      })

      test('invoices are fetched for the invoice account', async () => {
        expect(invoiceService.getInvoicesForInvoiceAccount.calledWith(
          'test-id', request.query.page, request.query.perPage
        )).to.be.true()
      })

      test('returns the result of the invoice service call', async () => {
        expect(result).to.equal({ foo: 'bar' })
      })

      experiment('when there is an error', () => {
        test('returns the expected error', async () => {
          const error = new Error('Oopsies!')
          error.name = 'InvalidEntityError'
          invoiceService.getInvoicesForInvoiceAccount.throws(error)
          result = await controller.getInvoices(request)
          expect(result.message).to.equal('Oopsies!')
        })
      })
    })
  })
})
