'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const Agreement = require('../../../../src/lib/connectors/bookshelf/Agreement')

experiment('lib/connectors/bookshelf/Agreement', () => {
  let instance

  beforeEach(async () => {
    instance = Agreement.forge()
    sandbox.stub(instance, 'belongsTo')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.financial_agreement_types table', async () => {
    expect(instance.tableName).to.equal('water.financial_agreement_types')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('id')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  experiment('the .licenceAgreement() relation', () => {
    beforeEach(async () => {
      instance.licenceAgreement()
    })

    test('is a function', async () => {
      expect(instance.licenceAgreement).to.be.a.function()
    })

    test('calls .belongsTo with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.belongsTo.lastCall.args
      expect(model).to.equal('LicenceAgreement')
      expect(foreignKey).to.equal('id')
      expect(foreignKeyTarget).to.equal('financial_agreement_type_id')
    })
  })
})
