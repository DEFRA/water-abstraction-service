'use strict'

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()

// Services
const dataService = require('../../../../../src/modules/billing/services/volume-matching-service/data-service')
const returnGroupService = require('../../../../../src/modules/billing/services/volume-matching-service/return-group-service')
const chargeVersionService = require('../../../../../src/lib/services/charge-versions')
const billingVolumesService = require('../../../../../src/modules/billing/services/billing-volumes-service')

// Models
const ChargeElementGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/charge-element-group')
const ReturnGroup = require('../../../../../src/modules/billing/services/volume-matching-service/models/return-group')
const AbstractionPeriod = require('../../../../../src/lib/models/abstraction-period')
const ChargeVersion = require('../../../../../src/lib/models/charge-version')

const DateRange = require('../../../../../src/lib/models/date-range')

const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants')

const {
  createReturn,
  createChargeElement,
  createPurposeUse,
  createChargeVersion,
  createLicence
} = require('./data')
const FinancialYear = require('../../../../../src/lib/models/financial-year')

const purposeUses = {
  sprayIrrigation: createPurposeUse('sprayIrrigation', true),
  trickleIrrigation: createPurposeUse('trickleIrrigation', true)
}

const chargeVersionId = uuid()
const financialYear = new FinancialYear(2020)
const licence = createLicence('01/123')

experiment('modules/billing/services/volume-matching-service/data-service', () => {
  beforeEach(async () => {
    sandbox.stub(returnGroupService, 'getReturnGroups').resolves({
      [RETURN_SEASONS.summer]: new ReturnGroup([
        createReturn(AbstractionPeriod.getSummer(), [purposeUses.sprayIrrigation], true)
      ]),
      [RETURN_SEASONS.winterAllYear]: new ReturnGroup([
        createReturn(AbstractionPeriod.getWinter(), [purposeUses.sprayIrrigation], false)
      ])
    })
    const chargeElements = [
      createChargeElement('summerSpray', AbstractionPeriod.getSummer(), purposeUses.sprayIrrigation),
      createChargeElement('winterSpray', AbstractionPeriod.getWinter(), purposeUses.sprayIrrigation)
    ]
    sandbox.stub(chargeVersionService, 'getByChargeVersionId').resolves(
      createChargeVersion(licence, chargeElements)
    )
    sandbox.stub(billingVolumesService, 'getVolumesForChargeElements').resolves([])
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getData', () => {
    let result

    experiment('when the charge version is found', () => {
      beforeEach(async () => {
        result = await dataService.getData(chargeVersionId, financialYear)
      })

      test('the charge version is fetched with the correct ID', async () => {
        expect(chargeVersionService.getByChargeVersionId.calledWith(
          chargeVersionId
        )).to.be.true()
      })

      test('gets the correct return groups', async () => {
        const [licenceNumber, finYear] = returnGroupService.getReturnGroups.lastCall.args
        expect(licenceNumber).to.equal(licence.licenceNumber)
        expect(finYear).to.equal(financialYear)
      })

      test('resolves with data in the expected shape', async () => {
        expect(result.chargeVersion instanceof ChargeVersion).to.be.true()
        expect(result.chargePeriod instanceof DateRange).to.be.true()

        expect(result.chargeElementGroup).instanceOf(ChargeElementGroup)
        expect(result.returnGroups[RETURN_SEASONS.summer]).instanceOf(ReturnGroup)
        expect(result.returnGroups[RETURN_SEASONS.winterAllYear]).instanceOf(ReturnGroup)
      })
    })

    experiment('when the charge version is not found', () => {
      beforeEach(async () => {
        chargeVersionService.getByChargeVersionId.resolves(null)
      })

      test('rejects with a NotFoundError', async () => {
        const func = () => dataService.getData(chargeVersionId, financialYear)
        const err = await expect(func()).to.reject()
        expect(err.name).to.equal('NotFoundError')
      })
    })
  })
})
