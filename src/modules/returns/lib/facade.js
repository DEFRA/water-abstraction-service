/**
 * This layer gets return data, and depending on the date, either
 * loads data from the NALD import DB, or direct from the returns service
 */
const moment = require('moment')
const { get } = require('lodash')
const apiConnector = require('./api-connector')
const naldConnector = require('../../import/lib/nald-returns-queries')
const waterHelpers = require('@envage/water-abstraction-helpers')

const { parseReturnId } = waterHelpers.returns
const { mapUnit } = waterHelpers.returns.mappers
const { naldToReturnLines } = require('./nald-returns-mapper')

/**
 * Gets version and line data from the returns service
 * @param {String} returnId
 * @param {Number} versionNumber
 * @return {Promise<Object>}
 */
const getServiceData = async (returnId, versionNumber) => {
  const version = await apiConnector.fetchVersion(returnId, versionNumber)
  const [versions, lines] = await Promise.all([
    apiConnector.fetchAllVersions(returnId),
    version ? apiConnector.fetchLines(returnId, version.version_id) : []
  ])
  return { version, versions, lines }
}

/**
 * Gets version and line data from the water.import schema in a format
 * similar to that stored in the return service
 * @param {Object} ret - the return record from the returns service
 * @return {Promise<Object>}
 */
const getNaldData = async ret => {
  const { return_id: returnId } = ret

  // For older returns, synthesise data direct from the NALD import tables
  const { regionCode, formatId, startDate, endDate } = parseReturnId(returnId)

  // Get data from NALD import schema
  const nilReturn = await naldConnector.isNilReturn(formatId, regionCode, startDate, endDate)
  const naldLines = nilReturn ? [] : await naldConnector.getLines(formatId, regionCode, startDate, endDate)

  const naldUnit = get(naldLines, '0.UNIT_RET_FLAG', 'M')

  const version = {
    version_id: returnId,
    return_id: returnId,
    version_number: 1,
    nil_return: nilReturn,
    metadata: {
      units: mapUnit(naldUnit)
    },
    current: true
  }

  return {
    version,
    versions: [version],
    lines: naldToReturnLines(ret, naldLines)
  }
}

const getReturnData = async (returnId, versionNumber) => {
  // Irrespective of whether service/NALD data, the return header is always loaded
  // from the returns service
  const ret = await apiConnector.fetchReturn(returnId)

  // Whether to use new returns service - service is used for returns with
  // end date on or after 31/10/2018
  const isNew = moment(ret.end_date).isSameOrAfter('2018-10-31')

  const data = isNew
    ? await getServiceData(returnId, versionNumber)
    : await getNaldData(ret)

  return {
    ...data,
    return: ret
  }
}

module.exports = {
  getReturnData
}
