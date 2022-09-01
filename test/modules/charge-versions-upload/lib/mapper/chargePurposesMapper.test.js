'use strict'

// Test framework dependencies
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

// Things we need to stub
const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')

// Thing under test
const chargePurposesMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargePurposesMapper')
const CHARGE_ELEMENT_DESCRIPTION = 'Valid Charge Element Description'
const PURPOSE_USE_DESCRIPTION = 'Valid Purpose Use Description'
const PURPOSE_USE_ID = 'a-uuid'

experiment('chargePurposesMapper', () => {
  experiment('#mapToPurposeUses', () => {
    beforeEach(() => {
      sandbox.stub(helpers, 'getPurposeUse').resolves({ purposeUseId: PURPOSE_USE_ID })
    })

    afterEach(() => {
      sandbox.restore()
    })

    test('maps the data specified to charge purposes', async () => {
      const result = await chargePurposesMapper.mapToChargePurposes()({
        chargeElementDescription: CHARGE_ELEMENT_DESCRIPTION,
        chargeElementPurpose: PURPOSE_USE_DESCRIPTION,
        chargeElementAbstractionPeriod: '01/22-04/22',
        chargeElementAuthorisedQuantity: '23.4567',
        chargeElementAgreementApply: 'Y'
      })

      expect(result).to.equal({
        loss: undefined,
        abstractionPeriod: { startDay: 1, startMonth: 22, endDay: 4, endMonth: 22 },
        authorisedAnnualQuantity: 23.4567,
        isSection127AgreementEnabled: true,
        purposeUse: {
          id: PURPOSE_USE_ID
        },
        purposePrimary: {},
        purposeSecondary: {},
        description: CHARGE_ELEMENT_DESCRIPTION
      })
    })
  })
})
