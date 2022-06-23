const { get } = require('lodash')
const moment = require('moment')
const { convertToCubicMetres, convertToUserUnit } = require('./unit-conversion')
const uuidv4 = require('uuid/v4')
const returnLines = require('@envage/water-abstraction-helpers').returns.lines

/**
 * Converts a line from the returns service to
 * the format for the water service return model
 * @param {Object} line - from return service
 * @return {Object}
 */
const returnLineToModel = (line) => {
  const {
    start_date: startDate,
    end_date: endDate,
    quantity,
    user_unit: userUnit,
    time_period: timePeriod,
    reading_type: readingType
  } = line

  return {
    startDate,
    endDate,
    quantity: convertToUserUnit(quantity, userUnit),
    timePeriod,
    readingType
  }
}

const mapMeter = meter => {
  return {
    ...meter,
    meterDetailsProvided: get(meter, 'meterDetailsProvided', !!meter.manufacturer)
  }
}

const getMetersFromVersionMetadata = version => {
  const meters = get(version, 'metadata.meters', [])
  return meters.map(mapMeter)
}

const getReadingFromVersionMetadata = version => {
  return {
    type: get(version, 'metadata.type', null),
    method: get(version, 'metadata.method', null),
    units: get(version, 'metadata.units', null),
    totalFlag: get(version, 'metadata.totalFlag', null),
    total: get(version, 'metadata.total', null),
    totalCustomDates: get(version, 'metadata.totalCustomDates', false),
    totalCustomDateStart: get(version, 'metadata.totalCustomDateStart', null),
    totalCustomDateEnd: get(version, 'metadata.totalCustomDateEnd', null)
  }
}

/**
 * Creates a unified data model for a single return
 * @param {Object} ret - return
 * @param {Object} version - the current / selected version of the return
 * @param {Array} lines - array of line data
 * @param {Object} document - CRM document
 * @return {Object} unified view of return
 */
const mapReturnToModel = (ret, version, lines, versions) => {
  const requiredLines = lines.length
    ? null
    : returnLines.getRequiredLines(ret.start_date, ret.end_date, ret.returns_frequency)

  return {
    returnId: ret.return_id,
    licenceNumber: ret.licence_ref,
    receivedDate: ret.received_date,
    startDate: moment(ret.start_date).format('YYYY-MM-DD'),
    endDate: moment(ret.end_date).format('YYYY-MM-DD'),
    dueDate: ret.due_date,
    frequency: ret.returns_frequency,
    isNil: get(version, 'nil_return'),
    status: ret.status,
    versionNumber: version ? version.version_number : null,
    isCurrent: version ? version.current : null,
    reading: getReadingFromVersionMetadata(version),
    meters: getMetersFromVersionMetadata(version),
    requiredLines,
    lines: lines ? lines.map(returnLineToModel) : null,
    metadata: ret.metadata,
    versions: versions.map(version => {
      return {
        versionNumber: version.version_number,
        email: version.user_id,
        createdAt: version.created_at,
        isCurrent: version.current
      }
    }),
    isUnderQuery: ret.under_query
  }
}

/**
 * Maps return model back to a return version row
 * @param {Object} ret - return model
 * @return {Object} version row for returns service
 */
const mapReturnToVersion = (ret) => {
  return {
    version_id: uuidv4(),
    return_id: ret.returnId,
    user_id: ret.user.email,
    user_type: ret.user.type,
    version_number: ret.versionNumber,
    metadata: JSON.stringify({
      ...ret.reading,
      meters: ret.meters
    }),
    nil_return: ret.isNil,
    current: true
  }
}

/**
 * Maps return model back to return lines
 * @param {Object} ret - return model
 * @return {Array} lines rows for returns service
 */
const mapReturnToLines = (ret, version) => {
  if (ret.lines) {
    return ret.lines.map(line => ({
      line_id: uuidv4(),
      version_id: version.version_id,
      substance: 'water',
      quantity: convertToCubicMetres(line.quantity, ret.reading.units),
      unit: 'm³',
      user_unit: ret.reading.units,
      start_date: line.startDate,
      end_date: line.endDate,
      time_period: line.timePeriod,
      metadata: '{}',
      reading_type: ret.reading.type
    }))
  }
  return null
}

/**
 * Maps water service model to those fields that need updating in returns service
 * @param {Object} ret - water service return model
 * @return {Object} data to store in returns table of returns service
 */
const mapReturn = (ret) => {
  const { status, receivedDate } = ret

  return {
    status,
    received_date: receivedDate,
    under_query: ret.isUnderQuery
  }
}

module.exports = {
  mapReturnToModel,
  mapReturnToVersion,
  mapReturnToLines,
  mapReturn
}
