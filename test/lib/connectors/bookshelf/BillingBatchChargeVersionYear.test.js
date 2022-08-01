'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const BillingBatchChargeVersionYear = require('../../../../src/lib/connectors/bookshelf/BillingBatchChargeVersionYear')

experiment('lib/connectors/bookshelf/BillingVolume', () => {
  let instance

  beforeEach(async () => {
    instance = BillingBatchChargeVersionYear.forge()
    sandbox.stub(instance, 'belongsTo')
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.billing_batch_charge_version_years table', async () => {
    expect(instance.tableName).to.equal('water.billing_batch_charge_version_years')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('billing_batch_charge_version_year_id')
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

  experiment('the .chargeVersion() relation', () => {
    beforeEach(async () => {
      instance.chargeVersion()
    })

    test('is a function', async () => {
      expect(instance.chargeVersion).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('ChargeVersion')
      expect(foreignKey).to.equal('charge_version_id')
      expect(foreignKeyTarget).to.equal('charge_version_id')
    })
  })
})
