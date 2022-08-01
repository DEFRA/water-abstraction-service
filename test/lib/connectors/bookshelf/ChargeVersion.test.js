'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ChargeVersion = require('../../../../src/lib/connectors/bookshelf/ChargeVersion')

experiment('lib/connectors/bookshelf/ChargeVersion', () => {
  let instance

  beforeEach(async () => {
    instance = ChargeVersion.forge()
    sandbox.stub(instance, 'belongsTo')
    sandbox.stub(instance, 'hasMany')
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.charge_versions table', async () => {
    expect(instance.tableName).to.equal('water.charge_versions')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('charge_version_id')
  })

  experiment('the .chargeElements() relation', () => {
    beforeEach(async () => {
      instance.chargeElements()
    })

    test('is a function', async () => {
      expect(instance.chargeElements).to.be.a.function()
    })

    test('calls .hasMany with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasMany.lastCall.args
      expect(model).to.equal('ChargeElement')
      expect(foreignKey).to.equal('charge_version_id')
      expect(foreignKeyTarget).to.equal('charge_version_id')
    })
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

  experiment('the .changeReason() relation', () => {
    beforeEach(async () => {
      instance.changeReason()
    })

    test('is a function', async () => {
      expect(instance.changeReason).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('ChangeReason')
      expect(foreignKey).to.equal('change_reason_id')
      expect(foreignKeyTarget).to.equal('change_reason_id')
    })
  })
})
