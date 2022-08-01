const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')
const sandbox = require('sinon').createSandbox()
const chargeCategoryService = require('../../../../../src/lib/services/charge-category')
const { mapToChargeCategory } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeCategoryMapper')

const TEST_CHARGE_CATEGORY_ID = uuid()
const TEST_REF = 'TEST REF'
const TEST_SHORT_DESC = 'TEST SHORT DESC'

experiment('mapTochargeCategory', () => {
  const chargeCategory = {
    billingChargeCategoryId: TEST_CHARGE_CATEGORY_ID,
    reference: TEST_REF,
    shortDescription: TEST_SHORT_DESC
  }

  beforeEach(() => {
    sandbox.stub(chargeCategoryService, 'findChargeCategoryByProperties').resolves(chargeCategory)
  })

  afterEach(() => {
    sandbox.restore()
  })

  test('when chargeCategory is returned', async () => {
    const chargeCategoryData = {}
    expect(await mapToChargeCategory(chargeCategoryData)).to.equal({
      id: TEST_CHARGE_CATEGORY_ID,
      reference: TEST_REF,
      shortDescription: TEST_SHORT_DESC
    })
  })

  test('when finding charge category by properties part 1', async () => {
    const chargeCategoryData = {
      chargeReferenceDetailsSource: 'N',
      chargeReferenceDetailsLoss: 'N',
      chargeReferenceDetailsVolume: '10.55',
      chargeReferenceDetailsWaterAvailability: 'N',
      chargeReferenceDetailsModelling: 'tier 1'
    }
    await mapToChargeCategory(chargeCategoryData)
    const { args } = chargeCategoryService.findChargeCategoryByProperties.lastCall
    expect(args).to.equal([
      'non-tidal',
      'N',
      10.55,
      false,
      'tier 1'
    ])
  })

  test('when finding charge category by properties part 2', async () => {
    const chargeCategoryData = {
      chargeReferenceDetailsSource: 'Y',
      chargeReferenceDetailsLoss: 'Y',
      chargeReferenceDetailsVolume: '10.55',
      chargeReferenceDetailsWaterAvailability: 'Y',
      chargeReferenceDetailsModelling: 'tier 2'
    }
    await mapToChargeCategory(chargeCategoryData)
    const { args } = chargeCategoryService.findChargeCategoryByProperties.lastCall
    expect(args).to.equal([
      'tidal',
      'Y',
      10.55,
      true,
      'tier 2'
    ])
  })
})
