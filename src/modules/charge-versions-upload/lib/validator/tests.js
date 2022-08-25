const { billing } = require('../../../../../config')
const helpers = require('../helpers')
const moment = require('moment')

const getColumnValue = (headings, columns, fieldName) => columns[headings.indexOf(fieldName)]

const testNotBlank = async (field, val) => val === '' ? `${field} is blank` : ''

const testAcceptedTerm = acceptedTerms => async (field, term) => acceptedTerms.includes(term) ? '' : `${field} is not an accepted term`

const testMaxLength = maxLength => async (field, val) => val.length > maxLength ? `${field} has more than ${maxLength} characters` : ''

const testMaxValue = maxValue => async (field, val) => parseFloat(val) > maxValue ? `${field} is too large` : ''

const testMaxDigits = maxDigits => async (field, val) => val.length > maxDigits ? `${field} has too many digits` : ''

const testValidLicence = async (field, _licenceNumber, licence) => {
  const { expiredDate, lapsedDate, revokedDate } = licence || {}
  if (licence && [expiredDate, lapsedDate, revokedDate].every(date => !date || new Date(date) >= billing.srocStartDate)) {
    return ''
  }

  return `${field} is not valid`
}

const testLicenceHasInvoiceAccount = async (field, _licenceNumber, licence, headings, columns) => {
  const invoiceAccountNumber = getColumnValue(headings, columns, 'charge_information_billing_account')
  const invoiceAccount = await helpers.getInvoiceAccount(licence, invoiceAccountNumber)
  if (invoiceAccount) {
    return ''
  }

  if (invoiceAccountNumber) {
    return `charge_information_billing_account is not valid for ${field}`
  }

  return `charge_information_billing_account is required for ${field}`
}

const testValidDate = async (field, date = '') => helpers.formatDate(date) ? '' : `"${field} has an incorrect format, expected DD/MM/YYYY"`

const testDateBeforeLicenceStartDate = async (field, date, licence) => {
  if (!licence) {
    return ''
  }

  try {
    const licenceDate = licence.startDate
    if (!licenceDate) {
      return ''
    }

    const comparisonDate = new Date(licenceDate)
    const formattedDate = helpers.formatDate(date)
    if (formattedDate >= comparisonDate) {
      return ''
    }
  } catch (_e) {}

  return `${field} is before the licence start date`
}

const testDateAfterLicenceExpiredDate = async (field, date, licence) => {
  if (!licence) {
    return ''
  }

  try {
    const licenceDate = licence.expiredDate
    if (!licenceDate) {
      return ''
    }

    const comparisonDate = new Date(licenceDate)
    const formattedDate = helpers.formatDate(date)
    if (formattedDate <= comparisonDate) {
      return ''
    }
  } catch (_e) {}

  return `${field} is after the licence expiry date`
}

const testDateBeforeSrocStartDate = async (field, date = '') => {
  const formattedDate = helpers.formatDate(date)
  const { srocStartDate } = billing
  if (date && formattedDate < srocStartDate) {
    return `${field} is before ${moment(srocStartDate).format('D MMMM YYYY')}`
  }

  return ''
}

const testPurpose = async (field, description, licence) => {
  if (licence) {
    const purpose = await helpers.getPurpose(description)

    if (!purpose) {
      return `${field} is not an accepted term`
    }
    // const licenceVersionPurposes = await helpers.getLicenceVersionPurposes(licence.id)
    // return licenceVersionPurposes.find(licenceVersionPurpose => licenceVersionPurpose.purposeUse.description === description) ? '' : `${field} is not an accepted term`
  }

  return ''
}

const testSupportedSourceOrBlank = async (field, name) => {
  if (name) {
    const supportedSources = await helpers.getSupportedSources()
    return supportedSources.find(supportedSource => supportedSource.name === name) ? '' : `${field} is not an accepted term`
  }

  return ''
}

const testPopulatedWhen = (fieldName, fieldValue, fieldTitle) => async (field, val, _licence, headings, columns) => {
  if (getColumnValue(headings, columns, fieldName) === fieldValue) {
    return val ? '' : `${field} is blank when the ${fieldTitle} is "${fieldValue}"`
  }

  return ''
}

const testBlankWhen = (fieldName, fieldValue, fieldTitle) => async (field, val, _licence, headings, columns) => {
  if (getColumnValue(headings, columns, fieldName) === fieldValue) {
    return val ? `${field} is populated when the ${fieldTitle} is "${fieldValue}"` : ''
  }

  return ''
}

const testDateRange = async (field, dateRange) => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  const validDate = (dd, mm) => (mm >= 1 && mm <= 12 && dd >= 1 && dd <= daysInMonth[mm - 1])
  let valid
  try {
    const [startDate, endDate] = dateRange.split('-')
    const [startDateDD, startDateMM] = startDate.split('/')
    const [endDateDD, endDateMM] = endDate.split('/')
    valid = validDate(startDateDD, startDateMM) && validDate(endDateDD, endDateMM)
  } catch (_e) {}
  return valid ? '' : `"${field} is an incorrect format, expected DD/MM-DD/MM"`
}

const testNumber = async (field, number) => {
  if (number === null) {
    return
  }

  if (!isNaN(parseInt(number))) {
    return
  }

  return `${field} is not a number`
}

const testNumberGreaterThanZero = async (field, number) => parseFloat(number) > 0 ? '' : `${field} is less than or equal to 0`

const testNumberLessThanOne = async (field, number) => parseFloat(number) < 1 ? '' : `${field} is greater than or equal to 1`

const testMaxDecimalPlaces = maxDecimalPlaces => async (field, number) => {
  let valid
  try {
    const [, decimalComponent = ''] = number.split('.')
    if (decimalComponent.length <= maxDecimalPlaces) {
      valid = true
    }
  } catch (_e) {}
  return valid ? '' : `${field} has more than ${maxDecimalPlaces} decimal places`
}

const testDateBefore = (fieldName, fieldTitle) => async (field, date, _licence, headings, columns) => {
  let valid
  try {
    const comparisonDate = helpers.formatDate(getColumnValue(headings, columns, fieldName))
    const formattedDate = helpers.formatDate(date)
    if (formattedDate >= comparisonDate) {
      valid = true
    }
  } catch (_e) {}
  return valid ? '' : `${field} is before the ${fieldTitle}`
}

const testMatchTPTPurpose = async (field, term, _licence, headings, columns) => {
  if (term === 'Y') {
    const description = getColumnValue(headings, columns, 'charge_element_purpose')
    const purposeUses = await helpers.getPurposeUses()
    const purpose = purposeUses.find(purposeUse => purposeUse.description === description)
    return purpose && purpose.isTwoPartTariff ? '' : `${field} does not match the purpose`
  }

  return ''
}

const testValidReferenceLineDescription = async (field, description) => {
  const invalidCharacters = /[“”?^£≥≤—]/

  return invalidCharacters.test(description) ? `${field} contains at least one unaccepted character` : ''
}

const testNotWaterUndertaker = async (field, value, licence) => {
  // We include a check for licence to ensure we don't incorrectly give an error if no licence is present
  if (value === 'Y' && licence && !licence.isWaterUndertaker) {
    return `${field} cannot be Y if the licence holder is not a water undertaker`
  }

  return ''
}

module.exports = {
  testNotBlank,
  testAcceptedTerm,
  testMaxLength,
  testMaxValue,
  testMaxDigits,
  testValidLicence,
  testLicenceHasInvoiceAccount,
  testValidDate,
  testDateAfterLicenceExpiredDate,
  testDateBeforeLicenceStartDate,
  testDateBeforeSrocStartDate,
  testPurpose,
  testSupportedSourceOrBlank,
  testPopulatedWhen,
  testBlankWhen,
  testDateRange,
  testNumber,
  testNumberGreaterThanZero,
  testNumberLessThanOne,
  testMaxDecimalPlaces,
  testDateBefore,
  testMatchTPTPurpose,
  testValidReferenceLineDescription,
  testNotWaterUndertaker
}
