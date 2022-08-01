'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ChargeVersionWorkflow = require('../../../../src/lib/connectors/bookshelf/ChargeVersionWorkflow')

experiment('lib/connectors/bookshelf/ChargeVersionWorkflow.js', () => {
  let instance

  beforeEach(async () => {
    instance = ChargeVersionWorkflow.forge()
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.charge_version_workflows table', async () => {
    expect(instance.tableName).to.equal('water.charge_version_workflows')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('charge_version_workflow_id')
  })

  test('defines hasTimestamps', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  test('does not throw an error if no data found on fetch', async () => {
    expect(instance.requireFetch).to.equal(false)
  })

  experiment('the .licence() relation', () => {
    beforeEach(async () => {
      instance.licence()
    })

    test('is a function', async () => {
      expect(instance.licence).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('Licence')
      expect(foreignKey).to.equal('licence_id')
      expect(foreignKeyTarget).to.equal('licence_id')
    })
  })
})
