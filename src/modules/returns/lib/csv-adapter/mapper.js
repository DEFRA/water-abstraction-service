'use strict'

const waterHelpers = require('@envage/water-abstraction-helpers')

const { unzip } = require('lodash')
const common = require('../common-mapping')

const moment = require('moment')
const DATE_FORMAT = 'YYYY-MM-DD'

const csvParser = require('./csv-parser')
const dateParser = require('./date-parser')

const ROW_INDEX = {
  nilReturn: 4,
  meterUsed: 5,
  meterMake: 6,
  meterSerial: 7
}

const { parseReturnId } = waterHelpers.returns

/**
 * Trims and lowercases value
 * @param  {String} value
 * @return {String}
 */
const normalize = value => value.trim().toLowerCase()

/**
 * Checks whether value is an acceptable 'yes' value
 * @param {String} value
 * @return {Boolean}
 */
const isYesValue = value => ['y', 'yes'].includes(normalize(value))

/**
 * Creates a skeleton return line object
 * @param  {String} dateLabel - the date label in the CSV
 * @param {Number} numberOfDataLines - how many lines of data for this return?
 * @return {Object}           - return line object
 */
const createReturnLine = (dateLabel) => dateParser.parse(dateLabel)

/**
 * Maps an abstracted volume to a float
 * - If empty string, returns null
 * - Otherwise parses as a number, which may include commas
 * @param  {String} value - the abstracted volume
 * @return {Number}
 */
const mapQuantity = value => {
  const val = normalize(value)
  if (val === '') {
    return null
  }
  return parseFloat(val.replace(/,/g, ''))
}

/**
 * Creates return lines array by combining CSV header and column data
 * @param  {Array} headers      - header column from CSV data
 * @param  {Array} column       - return column from CSV data
 * @param  {String} readingType - the reading type - estimated|measured
 * @return {Array}              - return lines array
 */
const mapLines = (headers, column, readingType) => {
  const lineHeaders = headers.slice(8, -1)
  const lineCells = column.slice(8, -1)

  return lineHeaders.reduce((acc, dateLabel, index) => {
    const value = normalize(lineCells[index])
    if (value === 'do not edit') {
      return acc
    }
    return [...acc, {
      unit: 'm³',
      userUnit: 'm³',
      ...createReturnLine(dateLabel),
      quantity: mapQuantity(value),
      readingType
    }]
  }, [])
}

/**
 * Maps reading object
 * @param  {Array} column  - column of return data from CSV
 * @return {Object}        - return reading object
 */
const mapReading = column => ({
  type: isYesValue(column[ROW_INDEX.meterUsed]) ? 'measured' : 'estimated',
  method: 'abstractionVolumes',
  units: 'm³',
  totalFlag: false
})

/**
 * Maps CSV column data and reading type to a meters array for the return
 * object
 * @param  {Array} column  - column of return data from CSV
 * @param  {String} readingType - the reading type - estimated|measured
 * @return {Array}             array of meter objects (only 1 supported at present)
 */
const mapMeters = (column, readingType) => {
  if (readingType === 'estimated') {
    return []
  }

  return [{
    meterDetailsProvided: true,
    manufacturer: column[ROW_INDEX.meterMake].trim(),
    serialNumber: column[ROW_INDEX.meterSerial].trim(),
    multiplier: 1
  }]
}

/**
 * Maps column and context data into a return object compatible with the
 * water service schema
 * @param  {Array} column  - column of return data from CSV
 * @param  {Object} context - additional data to generate the return
 * @param {Object} context.user - current user data
 * @param {String} context.today - current date
 * @param {Array} context.headers - the header column from the CSV data
 * @return {Object}         a single return object
 */
const mapReturn = (column, context) => {
  const isNil = isYesValue(column[ROW_INDEX.nilReturn])
  const returnId = column.slice(-1)[0]
  const { startDate, endDate, licenceNumber } = parseReturnId(returnId)

  // Create return skeleton
  const ret = {
    returnId,
    licenceNumber,
    receivedDate: context.today,
    startDate,
    endDate,
    isNil,
    ...common.getReturnSkeleton(),
    user: common.mapUser(context.user)
  }

  // Add lines/reading etc.
  if (!isNil) {
    ret.reading = mapReading(column)
    ret.lines = mapLines(context.headers, column, ret.reading.type)
    ret.meters = mapMeters(column, ret.reading.type)
    ret.frequency = ret.lines[0].timePeriod
  }

  // Return
  return ret
}

/**
 * Checks whether a cell is not empty
 * @param  {String}  value - the cell value
 * @return {Boolean}         true if the cell is not empty
 */
const isNotEmptyCell = value => !['', 'do not edit'].includes(normalize(value))

/**
 * Checks whether return column from the imported CSV is blank
 * The 0th, 1st and last cells should have a value in as that was provided
 * by the template.  All other cells will be empty to consider the return
 * as empty
 * @param  {Array}  column  - column of data from imported CSV
 * @return {Boolean}          true if the return is empty
 */
const isEmptyReturn = column => {
  const cells = column.slice(4, -1)
  return !cells.some(isNotEmptyCell)
}

/**
 * Maps a CSV file in string form to an array of return objects
 * @param  {String}  csvStr - CSV file in string form
 * @param  {Object}  user   - current user
 * @param  {String}  [today]- current date YYYY-MM-DD
 * @return {Promise<Array>} resolves with array of return objects
 */
const mapCsv = async (csvStr, user, today) => {
  const data = await csvParser.parseCsv(csvStr)

  const [headers, ...returns] = unzip(data)

  const context = {
    user,
    today: today || moment().format(DATE_FORMAT),
    headers
  }

  return returns.reduce((acc, column) => {
    return isEmptyReturn(column) ? acc : [...acc, mapReturn(column, context)]
  }, [])
}

exports._normalize = normalize
exports._createReturnLine = createReturnLine
exports._mapLines = mapLines
exports._mapReading = mapReading
exports._mapMeters = mapMeters
exports._mapReturn = mapReturn
exports._mapQuantity = mapQuantity
exports._isEmptyReturn = isEmptyReturn

exports.mapCsv = mapCsv
