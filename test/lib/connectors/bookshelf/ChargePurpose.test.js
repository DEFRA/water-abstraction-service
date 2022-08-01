'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ChargePurpose = require('../../../../src/lib/connectors/bookshelf/ChargePurpose')

experiment('lib/connectors/bookshelf/ChargePurpose', () => {
  let instance

  beforeEach(async () => {
    instance = ChargePurpose.forge()
    sandbox.stub(instance, 'belongsTo')
    sandbox.stub(instance, 'hasMany')
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.charge_purposes table', async () => {
    expect(instance.tableName).to.equal('water.charge_purposes')
  })

  test('has the expected timestamp fields', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('id')
  })
})
