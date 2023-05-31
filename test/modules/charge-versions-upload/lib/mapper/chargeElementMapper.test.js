const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { mapToChargeElement } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeElementMapper')
const adjustmentsMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/adjustmentsMapper')
const additionalChargesMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/additionalChargesMapper')

const chargePurposes = [{ name: 'TEST PURPOSE USE' }]
const chargeCategory = 'TEST CHARGE CATEGORY'
const adjustments = 'TEST ADJUSTMENTS'
const additionalCharges = 'TEST ADDITIONAL CHARGES'
const description = 'TEST DESCRIPTION'
const licence = {
  regionalChargeArea: {
    name: 'TEST EIU REGION'
  }
}

experiment('mapToChargeElement', () => {
  beforeEach(() => {
    sandbox.stub(adjustmentsMapper, 'mapToAdjustments').returns(adjustments)
    sandbox.stub(additionalChargesMapper, 'mapToAdditionalCharges').returns(additionalCharges)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('when mapping charge versions', async () => {
    const data = {
      licenceNumber: 'TH/038/0009/030/R01',
      chargeReferenceLineDescription: description,
      chargeReferenceDetailsLoss: 'medium',
      chargeReferenceDetailsVolume: '2920.25',
      chargeReferenceDetailsWaterAvailability: 'Y',
      chargeReferenceDetailsSource: 'Y',
      chargeReferenceDetailsModelling: 'tier 1',
      chargeReferenceDetailsTwoPartTariffAgreementApplies: 'N'
    }
    expect(await mapToChargeElement(
      data,
      licence,
      chargeCategory,
      chargePurposes
    )).to.equal({
      adjustments,
      additionalCharges,
      chargeCategory,
      chargePurposes,
      description,
      loss: 'medium',
      scheme: 'sroc',
      volume: 2920.25,
      eiucRegion: licence.regionalChargeArea.name,
      eiucSource: 'tidal',
      source: 'tidal',
      waterModel: 'tier 1',
      isRestrictedSource: true,
      isSection127AgreementEnabled: false
    })
  })
})
