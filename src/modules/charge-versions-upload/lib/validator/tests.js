const { billing } = require('../../../../../config');
const helpers = require('../helpers');
const { get, snakeCase } = require('lodash');
const moment = require('moment');
const { assertNullableNumeric } = require('../../../../lib/models/validators');

const getColumnValue = (headings, columns, fieldName) => columns[headings.indexOf(snakeCase(fieldName))];

const testNotBlank = async (field, val) => val === '' ? `${field} is blank` : '';

const testAcceptedTerm = acceptedTerms => async (field, term) => acceptedTerms.includes(term) ? '' : `${field} is not an accepted term`;

const testMaxLength = maxLength => async (field, val) => val.length > maxLength ? `${field} has more than ${maxLength} characters` : '';

const testMaxValue = maxValue => async (field, val) => parseFloat(val) > maxValue ? `${field} is too large` : '';

const testMaxDigits = maxDigits => async (field, val) => val.length > maxDigits ? `${field} has too many digits` : '';

const testValidLicence = async (field, _licenceNumber, licence) => {
  const { expiredDate, lapsedDate, revokedDate } = licence || {};
  if (licence && [expiredDate, lapsedDate, revokedDate].every(date => !date || new Date(date) >= billing.srocStartDate)) {
    return '';
  } else {
    return `${field} is not valid`;
  }
};

const testLicenceHasInvoiceAccount = async (field, _licenceNumber, licence, headings, columns) => {
  const invoiceAccountNumber = getColumnValue(headings, columns, 'chargeInformationBillingAccount');
  const invoiceAccount = await helpers.getInvoiceAccount(licence, invoiceAccountNumber);
  if (invoiceAccount) {
    return '';
  } else if (invoiceAccountNumber) {
    return `charge_information_billing_account is not valid for ${field}`;
  } else {
    return `charge_information_billing_account is required for ${field}`;
  }
};

const testValidDate = async (field, date = '') => helpers.formatDate(date) ? '' : `"${field} has an incorrect format, expected DD/MM/YYYY"`;

const testDateBeforeLicenceDate = (fieldName, fieldTitle) => async (field, date, licence) => {
  let valid;
  try {
    const licenceDate = get(licence, fieldName);
    if (licenceDate) {
      const comparisonDate = new Date(licence[fieldName]);
      const formattedDate = helpers.formatDate(date);
      if (formattedDate >= comparisonDate) {
        valid = true;
      }
    } else {
      valid = true;
    }
  } catch (_e) {}
  return valid ? '' : `${field} is before the licence ${fieldTitle}`;
};

const testDateAfterLicenceDate = (fieldName, fieldTitle) => async (field, date, licence) => {
  let valid;
  try {
    const licenceDate = get(licence, fieldName);
    if (licenceDate) {
      const comparisonDate = new Date(licence[fieldName]);
      const formattedDate = helpers.formatDate(date);
      if (formattedDate <= comparisonDate) {
        valid = true;
      }
    } else {
      valid = true;
    }
  } catch (_e) {}
  return valid ? '' : `${field} is after the licence ${fieldTitle}`;
};

const testDateBeforeSrocStartDate = async (field, date = '') => {
  const formattedDate = helpers.formatDate(date);
  const { srocStartDate } = billing;
  if (date && formattedDate < srocStartDate) {
    return `${field} is before ${moment(srocStartDate).format('D MMMM YYYY')}`;
  } else {
    return '';
  }
};

const testPurpose = async (field, description, licence) => {
  if (licence) {
    const licenceVersionPurposes = await helpers.getLicenceVersionPurposes(licence.id);
    return licenceVersionPurposes.find(licenceVersionPurpose => licenceVersionPurpose.purposeUse.description === description) ? '' : `${field} is not an accepted term`;
  }
  return '';
};

const testSupportedSourceOrBlank = async (field, name) => {
  if (name) {
    const supportedSources = await helpers.getSupportedSources();
    return supportedSources.find(supportedSource => supportedSource.name === name) ? '' : `${field} is not an accepted term`;
  } else {
    return '';
  }
};

const testPopulatedWhen = (fieldName, fieldValue, fieldTitle) => async (field, val, _licence, headings, columns) => {
  if (getColumnValue(headings, columns, fieldName) === fieldValue) {
    return val ? '' : `${field} is blank when the ${fieldTitle} is "${fieldValue}"`;
  } else {
    return '';
  }
};

const testBlankWhen = (fieldName, fieldValue, fieldTitle) => async (field, val, _licence, headings, columns) => {
  if (getColumnValue(headings, columns, fieldName) === fieldValue) {
    return val ? `${field} is populated when the ${fieldTitle} is "${fieldValue}"` : '';
  } else {
    return '';
  }
};

const testDateRange = async (field, dateRange) => {
  const daysInMonth = [31, 29, 31, 30, 31, 30, 30, 31, 30, 31, 30, 31];
  const validDate = (dd, mm) => (mm > 0 && mm <= 12 && dd > 0 && dd <= daysInMonth[mm - 1]);
  let valid;
  try {
    const [startDate, endDate] = dateRange.split('-');
    const [startDateDD, startDateMM] = startDate.split('/');
    const [endDateDD, endDateMM] = endDate.split('/');
    valid = validDate(startDateDD, startDateMM) && validDate(endDateDD, endDateMM);
  } catch (_e) {}
  return valid ? '' : `"${field} is an incorrect format, expected DD/MM-DD/MM"`;
};

const testNumber = async (field, number) => {
  let valid;
  try {
    assertNullableNumeric(number);
    valid = true;
  } catch (_e) {}
  return valid ? '' : `${field} is not a number`;
};

const testNumberGreaterThanZero = async (field, number) => parseFloat(number) > 0 ? '' : `${field} is less than or equal to 0`;

const testNumberGreaterThanOrEqualToZero = async (field, number) => parseFloat(number) >= 0 ? '' : `${field} is less than 0`;

const testNumberLessThanOne = async (field, number) => parseFloat(number) < 1 ? '' : `${field} is greater than or equal to 1`;

const testMaxDecimalPlaces = maxDecimalPlaces => async (field, number) => {
  let valid;
  try {
    const [, decimalComponent = ''] = number.split('.');
    if (decimalComponent.length <= maxDecimalPlaces) {
      valid = true;
    }
  } catch (_e) {}
  return valid ? '' : `${field} has more than ${maxDecimalPlaces} decimal places`;
};

const testDateBefore = (fieldName, fieldTitle) => async (field, date, _licence, headings, columns) => {
  let valid;
  try {
    const comparisonDate = helpers.formatDate(getColumnValue(headings, columns, fieldName));
    const formattedDate = helpers.formatDate(date);
    if (formattedDate >= comparisonDate) {
      valid = true;
    }
  } catch (_e) {}
  return valid ? '' : `${field} is before the ${fieldTitle}`;
};

const testMatchTPTPurpose = async (field, term, _licence, headings, columns) => {
  if (term === 'Y') {
    const description = getColumnValue(headings, columns, 'chargeElementPurpose');
    const purposeUses = await helpers.getPurposeUses();
    const purpose = purposeUses.find(purposeUse => purposeUse.description === description);
    return purpose && purpose.isTwoPartTariff ? '' : `${field} does not match the purpose`;
  } else {
    return '';
  }
};

const testValidReferenceLineDescription = async (field, description) => {
  const validCharacters = /[^a-z &*,./()\-\d]/i;
  return validCharacters.test(description) ? `${field} contains at least one unaccepted character` : '';
};

exports.testNotBlank = testNotBlank;
exports.testAcceptedTerm = testAcceptedTerm;
exports.testMaxLength = testMaxLength;
exports.testMaxValue = testMaxValue;
exports.testMaxDigits = testMaxDigits;
exports.testValidLicence = testValidLicence;
exports.testLicenceHasInvoiceAccount = testLicenceHasInvoiceAccount;
exports.testValidDate = testValidDate;
exports.testDateAfterLicenceDate = testDateAfterLicenceDate;
exports.testDateBeforeLicenceDate = testDateBeforeLicenceDate;
exports.testDateBeforeSrocStartDate = testDateBeforeSrocStartDate;
exports.testPurpose = testPurpose;
exports.testSupportedSourceOrBlank = testSupportedSourceOrBlank;
exports.testPopulatedWhen = testPopulatedWhen;
exports.testBlankWhen = testBlankWhen;
exports.testDateRange = testDateRange;
exports.testNumber = testNumber;
exports.testNumberGreaterThanZero = testNumberGreaterThanZero;
exports.testNumberGreaterThanOrEqualToZero = testNumberGreaterThanOrEqualToZero;
exports.testNumberLessThanOne = testNumberLessThanOne;
exports.testMaxDecimalPlaces = testMaxDecimalPlaces;
exports.testDateBefore = testDateBefore;
exports.testMatchTPTPurpose = testMatchTPTPurpose;
exports.testValidReferenceLineDescription = testValidReferenceLineDescription;
