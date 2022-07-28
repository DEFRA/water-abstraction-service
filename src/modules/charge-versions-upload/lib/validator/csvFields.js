const { WATER_MODEL } = require('../../../../lib/models/constants')
const {
  testAcceptedTerm, testNotBlank, testMaxLength, testNumberLessThanOne, testNumberGreaterThanZero, testNumber,
  testMaxDecimalPlaces, testBlankWhen, testPopulatedWhen, testSupportedSourceOrBlank, testValidReferenceLineDescription,
  testMaxValue, testMaxDigits, testMatchTPTPurpose, testDateAfterLicenceDate, testDateBefore, testValidDate,
  testDateRange, testPurpose, testDateBeforeSrocStartDate, testDateBeforeLicenceDate, testValidLicence,
  testLicenceHasInvoiceAccount, testNumberGreaterThanOrEqualToZero, testNotWaterUndertaker
} = require('./tests')

const csvFields = {
  licenceNumber: {
    validate: [
      testNotBlank,
      testValidLicence,
      testLicenceHasInvoiceAccount
    ]
  },
  chargeInformationStartDate: {
    validate: [
      testNotBlank,
      testValidDate,
      testDateBeforeLicenceDate('startDate', 'start date'),
      testDateBeforeSrocStartDate
    ]
  },
  chargeInformationBillingAccount: {
    // see validation above in licenceNumber when entered: "testLicenceHasInvoiceAccount"
  },
  chargeElementPurpose: {
    validate: [
      testNotBlank,
      testPurpose
    ]
  },
  chargeElementDescription: {
    validate: [
      testNotBlank
    ]
  },
  chargeElementAbstractionPeriod: {
    validate: [
      testDateRange
    ]
  },
  chargeElementAuthorisedQuantity: {
    validate: [
      testNumber,
      testMaxDecimalPlaces(6)
    ]
  },
  chargeElementTimeLimitStart: {
    skip: [
      testPopulatedWhen('chargeElementTimeLimitEnd', '')
    ],
    validate: [
      testNotBlank,
      testValidDate,
      testDateBefore('chargeInformationStartDate', 'charge information start date')
    ]
  },
  chargeElementTimeLimitEnd: {
    skip: [
      testPopulatedWhen('chargeElementTimeLimitStart', '')
    ],
    validate: [
      testNotBlank,
      testValidDate,
      testDateBefore('chargeElementTimeLimitStart', 'time limit start'),
      testDateAfterLicenceDate('expiredDate', 'expiry date')
    ]
  },
  chargeElementLoss: {
    validate: [
      testAcceptedTerm(['high', 'medium', 'low'])
    ]
  },
  chargeElementAgreementApply: {
    allow: [''],
    validate: [
      testAcceptedTerm(['Y', 'N']),
      testMatchTPTPurpose
    ]
  },
  chargeReferenceDetailsChargeElementGroup: {
    validate: [
      testNotBlank,
      testAcceptedTerm('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
    ]
  },
  chargeReferenceDetailsSource: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeReferenceDetailsLoss: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['high', 'medium', 'low'])
    ]
  },
  chargeReferenceDetailsVolume: {
    validate: [
      testNotBlank,
      testMaxDigits(17),
      testNumber,
      testNumberGreaterThanOrEqualToZero,
      testMaxDecimalPlaces(6),
      testMaxValue(1000000000000000)
    ]
  },
  chargeReferenceDetailsWaterAvailability: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeReferenceDetailsModelling: {
    validate: [
      testNotBlank,
      testAcceptedTerm(Object.values(WATER_MODEL))
    ]
  },
  chargeReferenceLineDescription: {
    validate: [
      testNotBlank,
      testMaxLength(180),
      testValidReferenceLineDescription
    ]
  },
  chargeReferenceDetailsSupportedSourceCharge: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeReferenceDetailsSupportedSourceName: {
    validate: [
      testSupportedSourceOrBlank,
      testPopulatedWhen('chargeReferenceDetailsSupportedSourceCharge', 'Y', 'supported source charge'),
      testBlankWhen('chargeReferenceDetailsSupportedSourceCharge', 'N', 'supported source charge')
    ]
  },
  chargeReferenceDetailsPublicWaterSupply: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N']),
      testNotWaterUndertaker
    ]
  },
  chargeReferenceDetailsAggregateFactor: {
    validate: [
      testNotBlank,
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero
    ]
  },
  chargeReferenceDetailsAdjustmentFactor: {
    validate: [
      testNotBlank,
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero
    ]
  },
  chargeReferenceDetailsAbatementFactor: {
    allow: [''],
    validate: [
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero,
      testNumberLessThanOne
    ]
  },
  chargeReferenceDetailsWinterDiscount: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeReferenceDetailsTwoPartTariffAgreementApplies: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeReferenceDetailsCanalAndRiverTrustAgreementApplies: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  chargeInformationNotes: {
    validate: [
      testMaxLength(500)
    ]
  }
}

exports.csvFields = csvFields
