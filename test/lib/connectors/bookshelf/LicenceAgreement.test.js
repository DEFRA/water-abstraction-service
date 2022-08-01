'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const LicenceAgreement = require('../../../../src/lib/connectors/bookshelf/LicenceAgreement')

experiment('lib/connectors/bookshelf/LicenceAgreement', () => {
  let instance

  beforeEach(async () => {
    instance = LicenceAgreement.forge()
    sandbox.stub(instance, 'belongsTo')
    sandbox.stub(instance, 'hasOne')
    sandbox.stub(instance, 'hasMany')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.licence_agreements table', async () => {
    expect(instance.tableName).to.equal('water.licence_agreements')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('licence_agreement_id')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  experiment('the .licence() relation', () => {
    beforeEach(async () => {
      instance.licence()
    })

    test('is a function', async () => {
      expect(instance.licence).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args
      expect(model).to.equal('Licence')
      expect(foreignKey).to.equal('licence_ref')
      expect(foreignKeyTarget).to.equal('licence_ref')
    })
  })

  experiment('the .financialAgreementType() relation', () => {
    beforeEach(async () => {
      instance.financialAgreementType()
    })

    test('is a function', async () => {
      expect(instance.financialAgreementType).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('FinancialAgreementType')
      expect(foreignKey).to.equal('financial_agreement_type_id')
      expect(foreignKeyTarget).to.equal('financial_agreement_type_id')
    })
  })
})
