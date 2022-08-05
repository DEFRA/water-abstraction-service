const { WATER_MODEL } = require('../../../../lib/models/constants')
const {
  testAcceptedTerm, testNotBlank, testMaxLength, testNumberLessThanOne, testNumberGreaterThanZero, testNumber,
  testMaxDecimalPlaces, testBlankWhen, testPopulatedWhen, testSupportedSourceOrBlank, testValidReferenceLineDescription,
  testMaxValue, testMaxDigits, testMatchTPTPurpose, testDateAfterLicenceExpiredDate, testDateBefore, testValidDate,
  testDateRange, testPurpose, testDateBeforeSrocStartDate, testDateBeforeLicenceStartDate, testValidLicence,
  testLicenceHasInvoiceAccount, testNotWaterUndertaker
} = require('./tests')

const csvFields = {
  licence_number: {
    validate: [
      testNotBlank,
      testValidLicence,
      testLicenceHasInvoiceAccount
    ]
  },
  charge_information_start_date: {
    validate: [
      testNotBlank,
      testValidDate,
      testDateBeforeLicenceStartDate,
      testDateBeforeSrocStartDate
    ]
  },
  charge_information_billing_account: {
    // see validation above in licenceNumber when entered: "testLicenceHasInvoiceAccount"
  },
  charge_element_purpose: {
    validate: [
      testNotBlank,
      testPurpose
    ]
  },
  charge_element_description: {
    validate: [
      testNotBlank
    ]
  },
  charge_element_abstraction_period: {
    validate: [
      testDateRange
    ]
  },
  charge_element_authorised_quantity: {
    validate: [
      testNumber,
      testMaxDecimalPlaces(6)
    ]
  },
  charge_element_time_limit_start: {
    skip: [
      testPopulatedWhen('charge_element_time_limit_end', '')
    ],
    validate: [
      testNotBlank,
      testValidDate,
      testDateBefore('charge_information_start_date', 'charge information start date')
    ]
  },
  charge_element_time_limit_end: {
    skip: [
      testPopulatedWhen('charge_element_time_limit_start', '')
    ],
    validate: [
      testNotBlank,
      testValidDate,
      testDateBefore('charge_element_time_limit_start', 'time limit start'),
      testDateAfterLicenceExpiredDate
    ]
  },
  charge_element_loss: {
    validate: [
      testAcceptedTerm(['high', 'medium', 'low'])
    ]
  },
  charge_element_agreement_apply: {
    allow: [''],
    validate: [
      testAcceptedTerm(['Y', 'N']),
      testMatchTPTPurpose
    ]
  },
  charge_reference_details_charge_element_group: {
    validate: [
      testAcceptedTerm('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''))
    ]
  },
  charge_reference_details_source: {
    validate: [
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_reference_details_loss: {
    validate: [
      testAcceptedTerm(['high', 'medium', 'low'])
    ]
  },
  charge_reference_details_volume: {
    validate: [
      testNotBlank,
      testMaxDigits(17),
      testNumber,
      testNumberGreaterThanZero,
      testMaxDecimalPlaces(6),
      testMaxValue(1000000000000000)
    ]
  },
  charge_reference_details_water_availability: {
    validate: [
      testNotBlank,
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_reference_details_modelling: {
    validate: [
      testAcceptedTerm(Object.values(WATER_MODEL))
    ]
  },
  charge_reference_line_description: {
    validate: [
      testNotBlank,
      testMaxLength(180),
      testValidReferenceLineDescription
    ]
  },
  charge_reference_details_supported_source_charge: {
    validate: [
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_reference_details_supported_source_name: {
    validate: [
      testSupportedSourceOrBlank,
      testPopulatedWhen('charge_reference_details_supported_source_charge', 'Y', 'supported source charge'),
      testBlankWhen('charge_reference_details_supported_source_charge', 'N', 'supported source charge')
    ]
  },
  charge_reference_details_public_water_supply: {
    validate: [
      testAcceptedTerm(['Y', 'N']),
      testNotWaterUndertaker
    ]
  },
  charge_reference_details_aggregate_factor: {
    validate: [
      testNotBlank,
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero
    ]
  },
  charge_reference_details_adjustment_factor: {
    validate: [
      testNotBlank,
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero
    ]
  },
  charge_reference_details_abatement_factor: {
    allow: [''],
    validate: [
      testMaxDecimalPlaces(15),
      testNumber,
      testNumberGreaterThanZero,
      testNumberLessThanOne
    ]
  },
  charge_reference_details_winter_discount: {
    validate: [
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_reference_details_two_part_tariff_agreement_applies: {
    validate: [
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_reference_details_canal_and_river_trust_agreement_applies: {
    validate: [
      testAcceptedTerm(['Y', 'N'])
    ]
  },
  charge_information_notes: {
    validate: [
      testMaxLength(500)
    ]
  }
}

exports.csvFields = csvFields
