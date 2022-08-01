'use strict'

const moment = require('moment')
const { isString } = require('lodash')
const { assertIsoString } = require('./models/validators')

const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * Takes an input and turns it into a string representation of a date
 * in the format YYYY-MM-DD
 *
 * @param {*} input A date, moment, string or null to format
 */
const formatDate = input => {
  return input ? moment(input).format(DATE_FORMAT) : null
}

/**
 * Helper for getting date time values. Will handle null, ISO strings, JS Dates or
 * moment objects representing a date with time.
 *
 * Throws errors if the value does not meet the above criteria, otherwise returns
 * the moment value of the input.
 *
 * @param {null|String|Date|moment} value The value to validate and return as a moment
 */
const getDateTimeFromValue = value => {
  if (value === null || moment.isMoment(value)) {
    return value
  }

  if (isString(value)) {
    assertIsoString(value)
    return moment(value)
  }

  if (moment.isDate(value)) {
    return moment(value)
  }

  throw new Error('Unexpected type for date input. Requires null, ISO string, date or moment')
}

exports.formatDate = formatDate
exports.getDateTimeFromValue = getDateTimeFromValue
