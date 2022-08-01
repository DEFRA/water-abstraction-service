
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const uuid = require('uuid/v4')

const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')

const { mapToChargePurposes } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargePurposesMapper')
const CHARGE_ELEMENT_DESCRIPTION = 'Valid Charge Element Description'
const PURPOSE_USE_DESCRIPTION = 'Valid Purpose Use Description'
const PURPOSE_USE_ID = uuid()
const PURPOSE_PRIMARY_ID = uuid()
const PURPOSE_SECONDARY_ID = uuid()
const PURPOSE_USE_LEGACY_ID = '1234'

experiment('mapToPurposeUses', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getLicenceVersionPurposes').resolves([{
      purposeUse: {
        purposeUseId: PURPOSE_USE_ID,
        legacyId: PURPOSE_USE_LEGACY_ID,
        description: PURPOSE_USE_DESCRIPTION
      },
      purposePrimary: {
        purposePrimaryId: PURPOSE_PRIMARY_ID,
        legacyId: PURPOSE_USE_LEGACY_ID,
        description: PURPOSE_USE_DESCRIPTION
      },
      purposeSecondary: {
        purposeSecondaryId: PURPOSE_SECONDARY_ID,
        legacyId: PURPOSE_USE_LEGACY_ID,
        description: PURPOSE_USE_DESCRIPTION
      }
    }])
  })

  afterEach(() => {
    sandbox.restore()
  })

  test('when mapping purpose use', async () => {
    const mapperFunction = mapToChargePurposes()
    expect(await mapperFunction({
      chargeElementDescription: CHARGE_ELEMENT_DESCRIPTION,
      chargeElementPurpose: PURPOSE_USE_DESCRIPTION,
      chargeElementAbstractionPeriod: '01/22-04/22',
      chargeElementAuthorisedQuantity: '23.4567',
      chargeElementAgreementApply: 'Y'
    })).to.equal({
      loss: undefined,
      abstractionPeriod: { startDay: 1, startMonth: 22, endDay: 4, endMonth: 22 },
      authorisedAnnualQuantity: 23.4567,
      isSection127AgreementEnabled: true,
      purposeUse: {
        id: PURPOSE_USE_ID,
        code: PURPOSE_USE_LEGACY_ID,
        name: PURPOSE_USE_DESCRIPTION
      },
      purposePrimary: {
        type: 'primary',
        id: PURPOSE_PRIMARY_ID,
        code: PURPOSE_USE_LEGACY_ID,
        name: PURPOSE_USE_DESCRIPTION
      },
      purposeSecondary: {
        type: 'secondary',
        id: PURPOSE_SECONDARY_ID,
        code: PURPOSE_USE_LEGACY_ID,
        name: PURPOSE_USE_DESCRIPTION
      },
      description: CHARGE_ELEMENT_DESCRIPTION
    })
  })
})
