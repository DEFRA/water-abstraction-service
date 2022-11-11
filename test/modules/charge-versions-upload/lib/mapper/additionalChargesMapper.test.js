const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const { v4: uuid } = require('uuid')
const sandbox = require('sinon').createSandbox()
const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')
const { mapToAdditionalCharges } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/additionalChargesMapper')

const TEST_SUPPORTED_SOURCE_NAME = 'TEST SUPPORTED SOURCE NAME'
const TEST_SUPPORTED_SOURCE_ID = uuid()

experiment('mapToadditionalCharges', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getSupportedSources').resolves([{ name: TEST_SUPPORTED_SOURCE_NAME, billingSupportedSourceId: TEST_SUPPORTED_SOURCE_ID }])
  })

  afterEach(() => {
    sandbox.restore()
  })

  test('when additionalCharges have not been entered', async () => {
    const additionalChargesData = {
      chargeReferenceDetailsSupportedSourceCharge: 'N',
      chargeReferenceDetailsPublicWaterSupply: 'N'
    }
    const expectedAdditionalCharges = null
    expect(await mapToAdditionalCharges(additionalChargesData)).to.equal(expectedAdditionalCharges)
  })

  test('when additionalCharges have been entered', async () => {
    const additionalChargesData = {
      chargeReferenceDetailsSupportedSourceCharge: 'Y',
      chargeReferenceDetailsPublicWaterSupply: 'Y',
      chargeReferenceDetailsSupportedSourceName: TEST_SUPPORTED_SOURCE_NAME
    }
    const expectedAdditionalCharges = {
      isSupplyPublicWater: true,
      supportedSource: {
        id: TEST_SUPPORTED_SOURCE_ID,
        name: TEST_SUPPORTED_SOURCE_NAME
      }
    }

    expect(await mapToAdditionalCharges(additionalChargesData)).to.equal(expectedAdditionalCharges)
  })
})
