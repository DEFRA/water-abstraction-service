'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const sandbox = require('sinon').createSandbox()

// Services
const returnGroupService = require('../../../../../src/modules/billing/services/volume-matching-service/return-group-service')
const returnsService = require('../../../../../src/lib/services/returns')

// Models
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period')
const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants')
const ReturnGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/return-group')

const {
  createReturn,
  createPurposeUse
} = require('./data')
const FinancialYear = require('../../../../../src/lib/models/financial-year')

const purposeUses = {
  sprayIrrigation: createPurposeUse('sprayIrrigation', true),
  trickleIrrigation: createPurposeUse('trickleIrrigation', true)
}

experiment('modules/billing/services/volume-matching-service/return-group-service', () => {
  let returns, result, financialYear

  beforeEach(async () => {
    returns = [
      createReturn(AbstractionPeriod.getSummer(), [purposeUses.sprayIrrigation], true),
      createReturn(AbstractionPeriod.getWinter(), [purposeUses.sprayIrrigation], false)
    ]
    sandbox.stub(returnsService, 'getReturnsForLicenceInFinancialYear').resolves(returns)
    financialYear = new FinancialYear(2020)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReturnGroups', () => {
    beforeEach(async () => {
      result = await returnGroupService.getReturnGroups('01/123', financialYear)
    })

    test('calls the return service with expected arguments', async () => {
      const [licenceNumber, finYear] = returnsService.getReturnsForLicenceInFinancialYear.lastCall.args
      expect(licenceNumber).to.equal('01/123')
      expect(finYear).to.equal(financialYear)
    })

    test('summer returns are placed in the summer group', async () => {
      expect(result[RETURN_SEASONS.summer]).to.be.instanceOf(ReturnGroup)
      expect(result[RETURN_SEASONS.summer].returns).to.be.an.array().length(1)
      expect(result[RETURN_SEASONS.summer].returns[0].isSummer).to.be.true()
    })

    test('winter/all year returns are placed in the winter/all year group', async () => {
      expect(result[RETURN_SEASONS.winterAllYear]).to.be.instanceOf(ReturnGroup)
      expect(result[RETURN_SEASONS.winterAllYear].returns).to.be.an.array().length(1)
      expect(result[RETURN_SEASONS.winterAllYear].returns[0].isSummer).to.be.false()
    })
  })
})
