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
const chargeElementMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeElementMapper')
const chargePurposesMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargePurposesMapper')
const chargeCategoryMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeCategoryMapper')
const changeReasonMapper = require('../../../../../src/modules/charge-versions-upload/lib/mapper/changeReasonMapper')
const helpers = require('../../../../../src/modules/charge-versions-upload/lib/helpers')

// Thing under test
const { mapToChargeVersion } = require('../../../../../src/modules/charge-versions-upload/lib/mapper/chargeVersionMapper')

const chargeElement = 'TEST_CHARGE_ELEMENT'
const chargePurpose = { name: 'TEST PURPOSE USE' }
const chargeCategory = 'TEST CHARGE CATEGORY'
const changeReason = 'TEST_CHARGE_REASON'
const invoiceAccount = 'TEST_INVOICE_ACCOUNT'
const licenceNumber = 'TEST_LICENCE_NUMBER'
const licence = {
  licenceNumber,
  regionalChargeArea: {
    name: 'TEST EIU REGION'
  }
}

const user = {
  user_id: 'USER_ID',
  user_name: 'USER_NAME'
}

const startDate = 'START_DATE'

const billingAccountNumber = 'TEST BILLING ACCOUNT NUMBER'

experiment('mapToChargeVersion', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getLicence').resolves(licence)
    sandbox.stub(helpers, 'getInvoiceAccount').resolves(invoiceAccount)
    sandbox.stub(helpers, 'formatDate').returns(startDate)
    sandbox.stub(chargePurposesMapper, 'mapToChargePurposes').resolves(chargePurpose)
    sandbox.stub(chargeCategoryMapper, 'mapToChargeCategory').resolves(chargeCategory)
    sandbox.stub(chargeElementMapper, 'mapToChargeElement').resolves(chargeElement)
    sandbox.stub(changeReasonMapper, 'mapToChangeReason').resolves(changeReason)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('when mapping charge versions, should create one charge element', async () => {
    const testGroupedData = [
      [
        { licenceNumber, purpose: 'A' },
        { licenceNumber, purpose: 'B' },
        { licenceNumber, purpose: 'C' }
      ]
    ]
    expect(await mapToChargeVersion(testGroupedData, user, billingAccountNumber)).to.equal({
      chargeVersion: {
        changeReason,
        invoiceAccount,
        scheme: 'sroc',
        status: 'draft',
        dateRange: { startDate },
        chargeElements: [chargeElement]
      },
      licenceRef: licenceNumber,
      user: {
        id: user.user_id,
        email: user.user_name
      }
    })

    expect(helpers.getInvoiceAccount.callCount).to.equal(1)
    expect(helpers.getInvoiceAccount.lastCall.args).to.equal([licence, billingAccountNumber])

    expect(chargeElementMapper.mapToChargeElement.callCount).to.equal(1)
    expect(chargeElementMapper.mapToChargeElement.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })

    expect(helpers.getLicence.callCount).to.equal(1)
    expect(changeReasonMapper.mapToChangeReason.callCount).to.equal(1)

    expect(chargePurposesMapper.mapToChargePurposes.callCount).to.equal(3)
    expect(chargePurposesMapper.mapToChargePurposes.firstCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })
    expect(chargePurposesMapper.mapToChargePurposes.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'C' })
  })

  test('when mapping charge versions, should create two charge elements', async () => {
    const testGroupedData = [
      [
        { licenceNumber, purpose: 'A' }
      ],
      [
        { licenceNumber, purpose: 'B' }
      ]
    ]
    expect(await mapToChargeVersion(testGroupedData, user, billingAccountNumber)).to.equal({
      chargeVersion: {
        changeReason,
        invoiceAccount,
        scheme: 'sroc',
        status: 'draft',
        dateRange: { startDate },
        chargeElements: [chargeElement, chargeElement]
      },
      licenceRef: licenceNumber,
      user: {
        id: user.user_id,
        email: user.user_name
      }
    })

    expect(helpers.getInvoiceAccount.callCount).to.equal(1)
    expect(helpers.getInvoiceAccount.lastCall.args).to.equal([licence, billingAccountNumber])

    expect(chargeElementMapper.mapToChargeElement.callCount).to.equal(2)
    expect(chargeElementMapper.mapToChargeElement.firstCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })
    expect(chargeElementMapper.mapToChargeElement.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'B' })

    expect(helpers.getLicence.callCount).to.equal(1)
    expect(changeReasonMapper.mapToChangeReason.callCount).to.equal(1)

    expect(chargePurposesMapper.mapToChargePurposes.callCount).to.equal(2)
    expect(chargePurposesMapper.mapToChargePurposes.firstCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })
    expect(chargePurposesMapper.mapToChargePurposes.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'B' })
  })

  test('when mapping charge versions, should create three charge elements', async () => {
    const testGroupedData = [
      [
        { licenceNumber, purpose: 'A' }
      ],
      [
        { licenceNumber, purpose: 'B' },
        { licenceNumber, purpose: 'C' }
      ],
      [
        { licenceNumber, purpose: 'D' },
        { licenceNumber, purpose: 'E' },
        { licenceNumber, purpose: 'F' }
      ]
    ]
    expect(await mapToChargeVersion(testGroupedData, user, billingAccountNumber)).to.equal({
      chargeVersion: {
        changeReason,
        invoiceAccount,
        scheme: 'sroc',
        status: 'draft',
        dateRange: { startDate },
        chargeElements: [chargeElement, chargeElement, chargeElement]
      },
      licenceRef: licenceNumber,
      user: {
        id: user.user_id,
        email: user.user_name
      }
    })

    expect(helpers.getInvoiceAccount.callCount).to.equal(1)
    expect(helpers.getInvoiceAccount.lastCall.args).to.equal([licence, billingAccountNumber])

    expect(chargeElementMapper.mapToChargeElement.callCount).to.equal(3)
    expect(chargeElementMapper.mapToChargeElement.firstCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })
    expect(chargeElementMapper.mapToChargeElement.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'D' })

    expect(helpers.getLicence.callCount).to.equal(1)
    expect(changeReasonMapper.mapToChangeReason.callCount).to.equal(1)

    expect(chargePurposesMapper.mapToChargePurposes.callCount).to.equal(6)
    expect(chargePurposesMapper.mapToChargePurposes.firstCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'A' })
    expect(chargePurposesMapper.mapToChargePurposes.lastCall.args[0]).to.equal({ licenceNumber: 'TEST_LICENCE_NUMBER', purpose: 'F' })
  })
})
