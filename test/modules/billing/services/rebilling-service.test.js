'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const { logger } = require('../../../../src/logger')

// Models
const Batch = require('../../../../src/lib/models/batch')
const FinancialYear = require('../../../../src/lib/models/financial-year')
const Invoice = require('../../../../src/lib/models/invoice')
const InvoiceAccount = require('../../../../src/lib/models/invoice-account')
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence')
const Licence = require('../../../../src/lib/models/licence')
const Transaction = require('../../../../src/lib/models/transaction')

// Services
const chargeModuleBillRunApi = require('../../../../src/lib/connectors/charge-module/bill-runs')
const invoiceService = require('../../../../src/lib/services/invoice-service')
const invoiceLicenceService = require('../../../../src/modules/billing/services/invoice-licences-service')
const transactionService = require('../../../../src/modules/billing/services/transactions-service')
const rebillingService = require('../../../../src/modules/billing/services/rebilling-service')

experiment('modules/billing/services/rebilling-service', () => {
  const invoiceId = uuid()
  const cmBillRunId = uuid()
  const rebilledInvoiceId = uuid()
  const cmInvoiceIds = [uuid(), uuid()]
  const cmTransactionIds = [uuid(), uuid()]
  const cmRebilledTransactionIds = [uuid(), uuid()]
  const licenceNumber = '01/123/ABC'

  const cmResponses = {
    rebill: {
      invoices: [
        {
          id: cmInvoiceIds[0],
          rebilledType: 'C'
        },
        {
          id: cmInvoiceIds[1],
          rebilledType: 'R'
        }
      ]
    },
    invoice: {
      invoice: {
        id: cmInvoiceIds[0],
        billRunId: cmBillRunId,
        customerReference: 'A00000000A',
        financialYear: 2021,
        deminimisInvoice: false,
        zeroValueInvoice: false,
        minimumChargeInvoice: false,
        transactionReference: null,
        creditLineValue: 9807,
        debitLineValue: 0,
        netTotal: -9807,
        rebilledType: 'C',
        rebilledInvoiceId,
        licences: [
          {
            id: 'e6c7a6e2-172f-4405-b03a-618c3ff75395',
            licenceNumber,
            netTotal: -9807,
            transactions: [
              {
                id: cmTransactionIds[0],
                clientId: null,
                chargeValue: 9807,
                credit: true,
                subjectToMinimumCharge: true,
                minimumChargeAdjustment: false,
                lineDescription: 'Transaction 1',
                periodStart: '2021-04-01T00:00:00.000Z',
                periodEnd: '2022-03-31T00:00:00.000Z',
                compensationCharge: false,
                rebilledTransactionId: cmRebilledTransactionIds[0]
              },
              {
                id: cmTransactionIds[1],
                clientId: null,
                chargeValue: 0,
                credit: true,
                subjectToMinimumCharge: true,
                minimumChargeAdjustment: false,
                lineDescription: 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element',
                periodStart: '2021-04-01T00:00:00.000Z',
                periodEnd: '2022-03-31T00:00:00.000Z',
                compensationCharge: true,
                rebilledTransactionId: cmRebilledTransactionIds[1]
              }
            ]
          }
        ]
      }
    }
  }

  const invoiceAccount = new InvoiceAccount()
  const licence = new Licence().fromHash({
    licenceNumber
  })
  const invoiceLicence = new InvoiceLicence().fromHash({
    licence,
    transactions: [
      new Transaction().fromHash({
        externalId: cmRebilledTransactionIds[0]
      }),
      new Transaction().fromHash({
        externalId: cmRebilledTransactionIds[1]
      })
    ]
  })
  const invoice = new Invoice().fromHash({
    id: invoiceId,
    externalId: rebilledInvoiceId,
    invoiceAccount,
    financialYear: new FinancialYear(2021),
    invoiceLicences: [invoiceLicence]
  })
  const batch = new Batch().fromHash({
    externalId: cmBillRunId
  })

  beforeEach(async () => {
    sandbox.stub(logger, 'info')
    sandbox.stub(logger, 'error')

    sandbox.stub(chargeModuleBillRunApi, 'rebillInvoice')
    sandbox.stub(chargeModuleBillRunApi, 'getInvoiceTransactions')
    sandbox.stub(chargeModuleBillRunApi, 'getStatus')

    sandbox.stub(invoiceService, 'getInvoiceById')
    sandbox.stub(invoiceService, 'createInvoice')

    sandbox.stub(invoiceLicenceService, 'saveInvoiceLicenceToDB')

    sandbox.stub(transactionService, 'saveTransactionToDB')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.rebillInvoice', () => {
    experiment('happy path', () => {
      beforeEach(async () => {
        invoiceService.getInvoiceById.resolves(invoice)

        chargeModuleBillRunApi.getStatus.resolves({
          status: 'initialised'
        })
        chargeModuleBillRunApi.rebillInvoice.resolves(cmResponses.rebill)
        chargeModuleBillRunApi.getInvoiceTransactions.resolves(cmResponses.invoice)
        await rebillingService.rebillInvoice(batch, invoiceId)
      })

      test('gets local source invoice model', () => {
        expect(invoiceService.getInvoiceById.calledWith(
          invoiceId
        )).to.be.true()
      })

      test('gets 2x CM invoices from CM API', () => {
        expect(chargeModuleBillRunApi.getInvoiceTransactions.callCount).to.equal(2)
        expect(chargeModuleBillRunApi.getInvoiceTransactions.calledWith(
          cmBillRunId, cmInvoiceIds[0]
        )).to.be.true()
        expect(chargeModuleBillRunApi.getInvoiceTransactions.calledWith(
          cmBillRunId, cmInvoiceIds[1]
        )).to.be.true()
      })

      test('creates 2x local invoices', () => {
        expect(invoiceService.createInvoice.callCount).to.equal(2)
      })

      test('creates 4x local transactions', () => {
        expect(transactionService.saveTransactionToDB.callCount).to.equal(4)
      })
    })
  })
})
