'use strict';

const { snakeCase, camelCase, get } = require('lodash');
const moment = require('moment');

const csvParser = require('./csv-parser');
const licencesService = require('../../../../lib/services/licences');
const repos = require('../../../../lib/connectors/repos');
const { billing } = require('../../../../../config');

const cache = {};

const {
  assertLicenceNumber,
  assertDate, assertNullableNumeric
} = require('../../../../lib/models/validators');

const formatDate = date => {
  try {
    const [day, month, year] = date.split('/');
    const formattedDate = `${year}-${month}-${day}`;
    assertDate(formattedDate);
    return new Date(formattedDate);
  } catch (_e) {
    return null;
  }
};

const getColumnValue = (headings, columns, fieldName) => columns[headings.indexOf(snakeCase(fieldName))];

const getLicence = async licenceNumber => {
  try {
    assertLicenceNumber(licenceNumber);
    return await licencesService.getLicenceByLicenceRef(licenceNumber);
  } catch (_e) {
    return null;
  }
};

const getPurposeUses = async () => {
  try {
    if (!cache.purposeUses) {
      cache.purposeUses = await repos.purposeUses.findAll();
    }
    return cache.purposeUses;
  } catch (_e) {
    return null;
  }
};

const getSupportedSources = async () => {
  try {
    if (!cache.supportedSources) {
      cache.supportedSources = await repos.supportedSources.findAll();
    }
    return cache.supportedSources;
  } catch (_e) {
    return null;
  }
};

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

const testValidDate = async (field, date = '') => formatDate(date) ? '' : `${field} has an incorrect format`;

const testDateBeforeLicenceDate = (fieldName, fieldTitle) => async (field, date, licence) => {
  let valid;
  try {
    const licenceDate = get(licence, fieldName);
    if (licenceDate) {
      const comparisonDate = new Date(licence[fieldName]);
      const formattedDate = formatDate(date);
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
      const formattedDate = formatDate(date);
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
  const formattedDate = formatDate(date);
  const { srocStartDate } = billing;
  if (date && formattedDate < srocStartDate) {
    return `${field} is before ${moment(srocStartDate).format('D MMMM YYYY')}`;
  } else {
    return '';
  }
};

const testPurpose = async (field, description) => {
  const purposeUses = await getPurposeUses();
  return purposeUses.find(purposeUse => purposeUse.description === description) ? '' : `${field} is not an accepted term`;
};

const testSupportedSourceOrBlank = async (field, name) => {
  if (name) {
    const supportedSources = await getSupportedSources();
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
  return valid ? '' : `${field} is an incorrect format`;
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
    const comparisonDate = formatDate(getColumnValue(headings, columns, fieldName));
    const formattedDate = formatDate(date);
    if (formattedDate >= comparisonDate) {
      valid = true;
    }
  } catch (_e) {}
  return valid ? '' : `${field} is before the ${fieldTitle}`;
};

const testMatchTPTPurpose = async (field, term, _licence, headings, columns) => {
  if (term === 'Y') {
    const description = getColumnValue(headings, columns, 'chargeElementPurpose');
    const purposeUses = await getPurposeUses();
    const purpose = purposeUses.find(purposeUse => purposeUse.description === description);
    return purpose && purpose.isTwoPartTariff ? '' : `${field} does not match the purpose`;
  } else {
    return '';
  }
};

const testValidReferenceLineDescription = async (field, description) => {
  const validCharacters = /[^a-z &*,./()\-\d]/i;
  return !(validCharacters.test(description)) ? '' : `${field} contains at least one unaccepted character`;
};

const csvFields = {
  licenceNumber: {
    validate: [
      testNotBlank,
      testValidLicence
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
    allow: [''],
    validate: [
      testValidDate,
      testDateBefore('chargeInformationStartDate', 'charge information start date')
    ]
  },
  chargeElementTimeLimitEnd: {
    allow: [''],
    validate: [
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
      testAcceptedTerm(['no model', 'tier 1', 'tier 2'])
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
      testAcceptedTerm(['Y', 'N'])
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
};

const expectedHeadings = Object.keys(csvFields).map(heading => snakeCase(heading));

/**
 * Validates that all the headings (the first column) are
 * not modified since the original download of the CSV template.
 */
const validateHeadings = headings => {
  const errors = [];
  const extraHeadings = headings.filter(heading => !expectedHeadings.includes(heading));
  const missingHeadings = expectedHeadings.filter(heading => !headings.includes(heading));
  if (extraHeadings.length) {
    errors.push(`Unexpected headings: ${extraHeadings.join(', ')}`);
  }
  if (missingHeadings.length) {
    errors.push(`Missing headings: ${missingHeadings.join(', ')}`);
  }
  return errors;
};

const validateRows = async (rows, headings) => {
  const validateField = async (heading, val, licence, columns, validator = []) => {
    const [...tests] = validator;
    let message = '';
    do {
      const test = tests.shift();
      if (test) {
        // When the message is populated, no other tests will be performed for that field
        message = await test(heading, val, licence, headings, columns);
      }
    } while (tests.length && !message);
    return message;
  };

  const validateRow = async (columns, rowIndex) => {
    // First of all assume the first column is the licence number so the licence details can be acquired and then used within some of the column checks
    const licence = await getLicence(columns[headings.indexOf('licence_number')]);
    const errors = await Promise.all(expectedHeadings.map(async (heading, colIndex) => {
      const { validate: validator, allow = [] } = csvFields[camelCase(heading)] || {};
      const val = columns[colIndex];
      if (allow.includes(val)) {
        return '';
      }
      return validator ? validateField(heading, val, licence, columns, validator) : Promise.resolve([]);
    }));

    const rowOffset = 2; // Takes into account the header row and the row index starting from 0

    return errors
      .flat()
      .filter(message => !!message)
      .map(error => `Row ${rowIndex + rowOffset}, ${error}`);
  };
  const validRows = await Promise.all(rows.map(validateRow));
  return validRows.flat();
};

const validate = async csv => {
  try {
    const data = await csvParser.parseCsv(csv);

    if (data.length === 0) {
      return createValidationResult(['Empty file'], 'empty');
    }

    const [headings, ...rows] = data;

    // validate the headings
    const headerErrors = validateHeadings(headings);

    if (headerErrors.length) {
      return createValidationResult(headerErrors, 'headers');
    }

    // headings are good, validate the row data
    const rowErrors = await validateRows(rows, headings);
    return createValidationResult(rowErrors, 'rows');
  } catch (err) {
    return createValidationResult([err.message], 'parse');
  }
};

const createValidationResult = (validationErrors, errorType) => validationErrors.length
  ? {
    errorType,
    validationErrors,
    isValid: false
  }
  : { isValid: true };

exports.validate = validate;
