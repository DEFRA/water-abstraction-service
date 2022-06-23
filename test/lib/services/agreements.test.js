'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const sandbox = require('sinon').createSandbox()

const service = require('../../../src/lib/services/service')
const agreementsService = require('../../../src/lib/services/agreements')
const agreementsRepo = require('../../../src/lib/connectors/repos/financial-agreement-types')
const agreementMapper = require('../../../src/lib/mappers/agreement')

experiment('src/lib/services/agreements', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getAgreementByCode', () => {
    test('delegates to the findOne() service helper', async () => {
      await agreementsService.getAgreementByCode('S127')
      expect(service.findOne.calledWith(
        'S127', agreementsRepo.findOneByFinancialAgreementCode, agreementMapper
      )).to.be.true()
    })
  })
})
