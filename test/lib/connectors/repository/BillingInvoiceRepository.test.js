const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const BillingInvoiceRepository = require('../../../../src/lib/connectors/repository/BillingInvoiceRepository')

experiment('lib/connectors/repository/BillingInvoiceRepository', () => {
  beforeEach(async () => {
    sandbox.stub(BillingInvoiceRepository.prototype, 'dbQuery')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findByBatchId', () => {
    let invoices

    beforeEach(async () => {
      BillingInvoiceRepository.prototype.dbQuery.resolves({
        rows: [1, 2, 3]
      })

      const repo = new BillingInvoiceRepository()
      invoices = await repo.findByBatchId('test-batch-id')
    })

    test('uses the batch id in the query params', async () => {
      const [, params] = BillingInvoiceRepository.prototype.dbQuery.lastCall.args
      expect(params).to.equal(['test-batch-id'])
    })

    test('returns the rows from the response', async () => {
      expect(invoices).to.equal([1, 2, 3])
    })
  })

  experiment('.getInvoiceDetail', () => {
    let invoice
    beforeEach(async () => {
      BillingInvoiceRepository.prototype.dbQuery.resolves({
        rows: [
          {
            'invoices.billing_invoice_id': 'test-invoice-id',
            'invoices.invoice_account_id': 'account-id',
            'invoices.invoice_account_number': '1122',
            'invoices.net_amount': 192,
            'invoices.is_credit': true,
            'invoices.date_created': '2020-01-27',

            'invoice_licence.licence_id': 'licence-1',
            'invoice_licence.licence_ref': '111/111',

            'transactions.authorised_days': 11,
            'transactions.billing_invoice_licence_id': 'licence-1'
          },
          {
            'invoices.billing_invoice_id': 'test-invoice-id',
            'invoices.invoice_account_id': 'account-id',
            'invoices.invoice_account_number': '1122',
            'invoices.net_amount': 192,
            'invoices.is_credit': true,
            'invoices.date_created': '2020-01-27',

            'invoice_licence.licence_id': 'licence-1',
            'invoice_licence.licence_ref': '111/111',

            'transactions.authorised_days': 22,
            'transactions.billing_invoice_licence_id': 'licence-1'
          },
          {
            'invoices.billing_invoice_id': 'test-invoice-id',
            'invoices.invoice_account_id': 'account-id',
            'invoices.invoice_account_number': '1122',
            'invoices.net_amount': 192,
            'invoices.is_credit': true,
            'invoices.date_created': '2020-01-27',

            'invoice_licence.licence_id': 'licence-2',
            'invoice_licence.licence_ref': '222/222',

            'transactions.authorised_days': 33,
            'transactions.billing_invoice_licence_id': 'licence-2'
          }
        ]
      })

      const repo = new BillingInvoiceRepository()
      invoice = await repo.getInvoiceDetail('test-invoice-id')
    })

    test('returns the invoice with the expected values', async () => {
      expect(invoice.billing_invoice_id).to.equal('test-invoice-id')
      expect(invoice.invoice_account_id).to.equal('account-id')
      expect(invoice.invoice_account_number).to.equal('1122')
      expect(invoice.net_amount).to.equal(192)
      expect(invoice.is_credit).to.equal(true)
      expect(invoice.date_created).to.equal('2020-01-27')
    })

    test('maps the two licences', async () => {
      expect(invoice.licences.length).to.equal(2)
      const licence1 = invoice.licences.find(l => l.licence_id === 'licence-1')
      const licence2 = invoice.licences.find(l => l.licence_id === 'licence-2')

      expect(licence1.licence_ref).to.equal('111/111')
      expect(licence2.licence_ref).to.equal('222/222')
    })

    test('the first licence has two transactions', async () => {
      const licence = invoice.licences.find(l => l.licence_id === 'licence-1')
      expect(licence.transactions.length).to.equal(2)
      expect(licence.transactions.find(t => t.authorised_days === 11)).to.exist()
      expect(licence.transactions.find(t => t.authorised_days === 22)).to.exist()
    })

    test('the second licence has one transaction', async () => {
      const licence = invoice.licences.find(l => l.licence_id === 'licence-2')
      expect(licence.transactions.length).to.equal(1)
      expect(licence.transactions.find(t => t.authorised_days === 33)).to.exist()
    })
  })

  experiment('.findOneByTransactionId', () => {
    const transactionId = 'transaction-id'

    experiment('when a row is found', () => {
      let result
      beforeEach(async () => {
        BillingInvoiceRepository.prototype.dbQuery.resolves({
          rows: [{
            transaction_id: transactionId
          }]
        })
        const repo = new BillingInvoiceRepository()
        result = await repo.findOneByTransactionId(transactionId)
      })

      test('calls dbQuery() with correct params', async () => {
        const [query, params] = BillingInvoiceRepository.prototype.dbQuery.lastCall.args
        expect(query).to.equal(BillingInvoiceRepository._findOneByTransactionIdQuery)
        expect(params).to.equal([transactionId])
      })

      test('resolves with found row', async () => {
        expect(result).to.be.an.object()
        expect(result.transaction_id).to.equal(transactionId)
      })
    })

    experiment('when a row is not found', () => {
      let result
      beforeEach(async () => {
        BillingInvoiceRepository.prototype.dbQuery.resolves({
          rows: []
        })
        const repo = new BillingInvoiceRepository()
        result = await repo.findOneByTransactionId(transactionId)
      })

      test('resolves with null', async () => {
        expect(result).to.equal(null)
      })
    })
  })
})
