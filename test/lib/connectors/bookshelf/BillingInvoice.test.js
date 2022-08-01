'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const BillingInvoice = require('../../../../src/lib/connectors/bookshelf/BillingInvoice')

experiment('lib/connectors/bookshelf/BillingInvoice', () => {
  let instance

  beforeEach(async () => {
    instance = BillingInvoice.forge()
    sandbox.stub(instance, 'belongsTo')
    sandbox.stub(instance, 'hasMany')
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.billing_invoices table', async () => {
    expect(instance.tableName).to.equal('water.billing_invoices')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('billing_invoice_id')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  experiment('the .billingBatch() relation', () => {
    beforeEach(async () => {
      instance.billingBatch()
    })

    test('is a function', async () => {
      expect(instance.billingBatch).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args
      expect(model).to.equal('BillingBatch')
      expect(foreignKey).to.equal('billing_batch_id')
      expect(foreignKeyTarget).to.equal('billing_batch_id')
    })
  })

  experiment('the .billingInvoiceLicences() relation', () => {
    beforeEach(async () => {
      instance.billingInvoiceLicences()
    })

    test('is a function', async () => {
      expect(instance.billingInvoiceLicences).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args
      expect(model).to.equal('BillingInvoiceLicence')
      expect(foreignKey).to.equal('billing_invoice_id')
      expect(foreignKeyTarget).to.equal('billing_invoice_id')
    })
  })

  experiment('the .linkedBillingInvoices() relation', () => {
    beforeEach(async () => {
      instance.linkedBillingInvoices()
    })

    test('is a function', async () => {
      expect(instance.linkedBillingInvoices).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args
      expect(model).to.equal('BillingInvoice')
      expect(foreignKey).to.equal('original_billing_invoice_id')
      expect(foreignKeyTarget).to.equal('original_billing_invoice_id')
    })
  })

  experiment('the .originalBillingInvoice() relation', () => {
    beforeEach(async () => {
      instance.originalBillingInvoice()
    })

    test('is a function', async () => {
      expect(instance.originalBillingInvoice).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('BillingInvoice')
      expect(foreignKey).to.equal('billing_invoice_id')
      expect(foreignKeyTarget).to.equal('original_billing_invoice_id')
    })
  })
})
