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

const financialAgreementTypesRepo = require('../../../../src/lib/connectors/repos/financial-agreement-types')
const { FinancialAgreementType } = require('../../../../src/lib/connectors/bookshelf')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/financial-agreement-types', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findOneByFinancialAgreementCode', () => {
    test('delegates to .findOne helper', async () => {
      await financialAgreementTypesRepo.findOneByFinancialAgreementCode('S127')
      expect(helpers.findOne.calledWith(
        FinancialAgreementType, 'financialAgreementCode', 'S127'
      )).to.be.true()
    })
  })
})
