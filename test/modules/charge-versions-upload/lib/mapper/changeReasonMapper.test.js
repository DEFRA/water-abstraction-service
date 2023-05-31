const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const { v4: uuid } = require('uuid')

const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')
const { mapToChangeReason } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/changeReasonMapper')

const CHANGE_REASON_DESCRIPTION = 'Valid Charge Reason Description'
const CHANGE_REASON_ID = uuid()
const CHANGE_REASON_TYPE = 'Valid Charge Reason Type'

experiment('mapToChangeReasons', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getChangeReason').resolves({
      type: CHANGE_REASON_TYPE,
      changeReasonId: CHANGE_REASON_ID,
      description: CHANGE_REASON_DESCRIPTION,
      isEnabledForNewChargeVersions: true,
      triggersMinimumCharge: false,
      isTwoPartTariff: false
    })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('when mapping purpose use', async () => {
    expect(await mapToChangeReason({
      chargeElementPurpose: CHANGE_REASON_DESCRIPTION
    })).to.equal({
      type: CHANGE_REASON_TYPE,
      id: CHANGE_REASON_ID,
      isEnabledForNewChargeVersions: true,
      triggersMinimumCharge: false,
      description: CHANGE_REASON_DESCRIPTION
    })
  })
})
