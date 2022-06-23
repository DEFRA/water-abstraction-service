'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ReturnRequirementPurpose = require('../../../../src/lib/connectors/bookshelf/ReturnRequirementPurpose')

experiment('lib/connectors/bookshelf/ReturnRequirementPurpose.js', () => {
  let instance

  beforeEach(async () => {
    instance = ReturnRequirementPurpose.forge()
    sandbox.stub(instance, 'hasOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('uses the water.return_requirement_purposes table', async () => {
    expect(instance.tableName).to.equal('water.return_requirement_purposes')
  })

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('return_requirement_purpose_id')
  })

  test('configures timestamps', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated'])
  })

  experiment('the .purposeUse() relation', () => {
    beforeEach(async () => {
      instance.purposeUse()
    })

    test('is a function', async () => {
      expect(instance.purposeUse).to.be.a.function()
    })

    test('calls .hasOne with correct params', async () => {
      const [model, foreignKey, foreignKeyTarget] = instance.hasOne.lastCall.args
      expect(model).to.equal('PurposeUse')
      expect(foreignKey).to.equal('purpose_use_id')
      expect(foreignKeyTarget).to.equal('purpose_use_id')
    })
  })
})
