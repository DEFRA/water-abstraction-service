'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const returnRequirementsRepo = require('../../../../src/lib/connectors/repos/return-requirements')
const ReturnRequirement = require('../../../../src/lib/connectors/bookshelf/ReturnRequirement')

const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/return-versions', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findOneByExternalId', () => {
    beforeEach(async () => {
      await returnRequirementsRepo.findOneByExternalId('1:123')
    })

    test('delegates to the findOne helper', async () => {
      const [model, key, value, withRelated] = helpers.findOne.lastCall.args
      expect(model).to.equal(ReturnRequirement)
      expect(key).to.equal('externalId')
      expect(value).to.equal('1:123')
      expect(withRelated).to.equal([
        'returnRequirementPurposes',
        'returnRequirementPurposes.purposeUse'
      ])
    })
  })
})
