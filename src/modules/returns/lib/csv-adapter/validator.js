'use strict'

const { flatten, times } = require('lodash')

const waterHelpers = require('@envage/water-abstraction-helpers')
const { returnIDRegex, parseReturnId } = waterHelpers.returns

const dateParser = require('./date-parser')
const csvParser = require('./csv-parser')

const lineErrorRegex = /line (\d*)$/
const validAbstractionVolumeRegex = /(^Do not edit$)|(^-?\d[\d.,]*$)|(^\s*$)/

const errorMessages = {
  licenceNumber: 'Licence number is missing',
  returnReference: 'All return references should be integers',
  nilReturn: 'Nil return should be Y, N or empty',
  meterUsed: 'Did you use a meter should be Y, N or empty',
  abstractionVolumes: 'Abstraction volumes must be numbers',
  returnId: 'Return id in unexpected format'
}

/**
 * Takes a column of CSV data and maps to an object to represent
 * a single licence return item.
 *
 * Ignore the data on rows 3 and 4 which is purely presentational
 * data for the site description and purpose.
 */
const createLicenceReturn = column => ({
  licenceNumber: { line: 1, value: column[0] },
  returnReference: { line: 2, value: column[1] },
  isNilReturn: { line: 5, value: column[4] },
  meterUsed: { line: 6, value: column[5] },
  meterMake: { line: 7, value: column[6] },
  meterSerialNumber: { line: 8, value: column[7] },
  abstractionVolumes: column.slice(8, column.length - 1).map((value, index) => ({
    line: 9 + index,
    value
  })),
  returnId: { line: column.length, value: column.reverse()[0] }
})

/**
 * If expectation is a string, the value is compared, otherwise
 * it is assumed that the expectation is a function and the value
 * is passed to the function
 * @param  {string|function} expectation How to evaluate the validity of the value
 * @param  {any} val The value to validate
 * @return {boolean} True if the value meets the expectation
 */
const validateExpectation = (expectation, val) => {
  if (typeof expectation === 'string') {
    return val === expectation
  } else {
    return expectation(val)
  }
}

const getHeadingExpectation = expectation => ({
  expectation,
  errorMessage: `${expectation} field not in expected position`
})

/**
 * Gets an array of validations to perform where each validator
 * sits at the same index of the target array.
 */
const getHeadingValidation = column => {
  const validators = [
    getHeadingExpectation('Licence number'),
    getHeadingExpectation('Return reference'),
    getHeadingExpectation('Site description'),
    getHeadingExpectation('Purpose'),
    getHeadingExpectation('Nil return Y/N'),
    getHeadingExpectation('Did you use a meter Y/N'),
    getHeadingExpectation('Meter make'),
    getHeadingExpectation('Meter serial number')
  ]

  times(column.length - 9, () => {
    validators.push({
      expectation: val => dateParser.validate(val),
      errorMessage: 'Unexpected date format for return line'
    })
  })

  validators.push(getHeadingExpectation('Unique return reference'))

  return validators
}

/**
 * Takes a 2d array of records and returns the required
 * column.
 * @param  {Array} records     The 2d array of CSV records
 * @param  {Number} columnIndex Which column is required
 * @return {Array} An array representing a column of CSV data
 */
const getColumn = (records, columnIndex) => {
  return records.reduce((acc, record) => {
    acc.push(record[columnIndex])
    return acc
  }, [])
}

const createError = (message, line) => ({ message, line })

const extractLineNumberFromError = err => {
  const matches = lineErrorRegex.exec(err)
  return matches ? parseInt(matches[1]) : -1
}

const createErrorFromCsvParseError = err => {
  return createError(err, extractLineNumberFromError(err))
}

/**
 * Validates that all the headings (the first column) are
 * not modified since the original download of the CSV template.
 */
const validateHeadings = records => {
  const firstColumn = getColumn(records, 0)
  const validators = getHeadingValidation(firstColumn)

  const errors = firstColumn.reduce((acc, row, index) => {
    const { errorMessage, expectation } = validators[index]

    if (!validateExpectation(expectation, row)) {
      acc.push(createError(errorMessage, index + 1))
    }
    return acc
  }, [])

  return errors.filter(x => !!x)
}

/**
 * Maps the CSV records array to an array of licence objects.
 */
const recordsToLicences = records => {
  const licences = []

  for (let i = 1; i < records[0].length; i++) {
    licences.push(createLicenceReturn(getColumn(records, i)))
  }
  return licences
}

/**
 * Checks if the licence number is present
 */
const validateLicenceNumber = licence => {
  const { value, line } = licence.licenceNumber

  if (!value) {
    return createError(errorMessages.licenceNumber, line)
  }
}

/**
 * Checks if the return rerefence is not empty and is a number
 */
const validateReturnReference = licence => {
  const { value, line } = licence.returnReference

  if (!value || /^\d{1,}$/g.test(value) === false) {
    return createError(errorMessages.returnReference, line)
  }
}

const isValidBooleanOrEmpty = (licence, licenceKey, errorKey = licenceKey) => {
  const { value, line } = licence[licenceKey]
  const isValid = ['y', 'n', 'yes', 'no', ''].includes(value.toLowerCase().trim())

  if (!isValid) {
    return createError(errorMessages[errorKey], line)
  }
}

const validateMeterUsed = licence => isValidBooleanOrEmpty(licence, 'meterUsed')
const validateNilReturn = licence => isValidBooleanOrEmpty(licence, 'isNilReturn', 'nilReturn')

/**
 * Checks that the abstraction volumes are valid.
 *
 * They can be:
 *   - empty
 *   - 'Do not edit'
 *   - A number including commas.
 */
const validateAbstractionVolumes = licence => {
  return licence.abstractionVolumes.reduce((acc, volume) => {
    const { value, line } = volume
    const isValueValid = validAbstractionVolumeRegex.test(value)

    if (!isValueValid) {
      acc.push(createError(errorMessages.abstractionVolumes, line))
    }
    return acc
  }, [])
}

/**
 * Checks that the return id:
 *
 *  - Matches the return id regex
 *  - Contains the licence number
 *  - Contains the return reference
 */
const validateReturnId = licence => {
  const { value, line } = licence.returnId
  const matchesReturnIdPattern = returnIDRegex.test(value)

  if (matchesReturnIdPattern) {
    const licenceNumber = licence.licenceNumber.value
    const returnReference = licence.returnReference.value
    const parsed = parseReturnId(value)

    if (parsed.licenceNumber === licenceNumber &&
      parsed.formatId === returnReference) {
      return
    }
  }

  return createError(errorMessages.returnId, line)
}

const validateLicences = licences => {
  const errors = licences.reduce((acc, licence, index) => {
    acc.push(validateLicenceNumber(licence))
    acc.push(validateReturnReference(licence))
    acc.push(validateNilReturn(licence))
    acc.push(validateMeterUsed(licence))
    acc.push(validateAbstractionVolumes(licence))
    acc.push(validateReturnId(licence))
    return acc
  }, [])

  return flatten(errors.filter(x => !!x))
}

const validate = async csv => {
  try {
    const records = await csvParser.parseCsv(csv)

    // validate the headings
    const headerErrors = validateHeadings(records)

    if (headerErrors.length) {
      return createValidationResult(headerErrors)
    }

    // headings are good, validate the licence data
    const licenceErrors = validateLicences(recordsToLicences(records))
    return createValidationResult(licenceErrors)
  } catch (err) {
    const parseErrors = [createErrorFromCsvParseError(err.message)]
    return createValidationResult(parseErrors)
  }
}

const createValidationResult = (errors = []) => ({
  isValid: errors.length === 0,
  validationErrors: errors
})

exports.errorMessages = errorMessages
exports.validate = validate
