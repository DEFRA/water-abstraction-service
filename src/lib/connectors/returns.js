const apiClientFactory = require('./api-client-factory')
const moment = require('moment')
const helpers = require('@envage/water-abstraction-helpers')
const urlJoin = require('url-join')
const { URL } = require('url')

const { chunk } = require('../../lib/object-helpers.js')
const DATE_FORMAT = 'YYYY-MM-DD'

const config = require('../../../config')

const returnsClient = apiClientFactory.create(`${config.services.returns}/returns`)

const versionsClient = apiClientFactory.create(`${config.services.returns}/versions`)

const linesClient = apiClientFactory.create(`${config.services.returns}/lines`)

/**
 * Get a single chunk of active returns with the return IDs
 * specified
 * @param {Array} returnIds
 * @return {Promise<Array>} returns
 */
const getActiveReturnsChunk = (returnIds) => {
  const filter = {
    return_id: {
      $in: returnIds
    },
    status: {
      $ne: 'void'
    },
    end_date: {
      $gte: '2018-10-31',
      $lte: moment().format(DATE_FORMAT)
    },
    'metadata->>isCurrent': 'true'
  }

  const columns = ['return_id', 'status', 'due_date', 'start_date', 'end_date', 'returns_frequency']

  return returnsClient.findAll(filter, null, columns)
}

/**
 * Gets an array of returns in the return service matching the
 * uploaded returns that are not void and are current.
 * The requests are chunked into batches of 20 to avoid the
 * query strings getting too long.
 * @param  {Array} returnIds - an array of return IDs to find
 * @return {Promise<Array>} active returns found in returns service
 */
const getActiveReturns = async returnIds => {
  const returnIdBatches = chunk(returnIds, 20)
  const returnsBatches = await Promise.all(
    returnIdBatches.map(getActiveReturnsChunk)
  )

  return returnsBatches.flat(Infinity)
}

/**
 * Gets due returns in the current cycle that relate to the current version
 * of a licence.
 * @param  {Array} excludeLicences - if passed in, these licences will be excluded
 * @param  {Object} returnCycle    - the return cycle to find due returns in
 * @return {Promise<Array>}        - all returns matching criteria
 */
const getCurrentDueReturns = async (excludeLicences, returnCycle) => {
  const { startDate, endDate, isSummer, dueDate } = returnCycle

  const filter = {
    start_date: { $gte: startDate },
    end_date: { $lte: endDate },
    status: 'due',
    regime: 'water',
    licence_type: 'abstraction',
    'metadata->>isCurrent': 'true',
    'metadata->>isSummer': isSummer ? 'true' : 'false',
    ...dueDate && { due_date: dueDate }
  }

  const results = await returnsClient.findAll(filter)

  return results.filter(ret => !excludeLicences.includes(ret.licence_ref))
}

const getServiceVersion = async () => {
  const urlParts = new URL(config.services.returns)
  const url = urlJoin(urlParts.protocol, urlParts.host, 'health/info')
  const response = await helpers.serviceRequest.get(url)
  return response.version
}

const getReturnsForLicence = async (licenceNumber, startDate, endDate) => {
  const filter = {
    licence_ref: licenceNumber,
    status: {
      $ne: 'void'
    },
    start_date: { $gte: startDate },
    end_date: { $lte: endDate }
  }
  return returnsClient.findAll(filter)
}

const getVersion = async ret => {
  const filter = {
    return_id: ret.return_id,
    current: true
  }
  const sort = { version_number: -1 }
  const versions = await versionsClient.findAll(filter, sort)
  return versions[0]
}

const getLinesForReturn = async ret => {
  const version = await getVersion(ret)
  if (!version) return null
  const linesFilter = { version_id: version.version_id }
  return linesClient.findAll(linesFilter)
}

/**
 * Gets a report of return cycles with data on number of returns in each status
 *
 * @return {Promise<Object>}
 */
const getReturnsCyclesReport = async startDate => {
  const url = urlJoin(config.services.returns, 'return-cycles/report')
  const options = {
    qs: {
      startDate
    }
  }
  return helpers.serviceRequest.get(url, options)
}

/**
 * Gets a single return cycle by ID
 *
 * @param {String} returnCycleId
 * @return {Promise<Object>}
 */
const getReturnCycleById = async returnCycleId => {
  const url = urlJoin(config.services.returns, 'return-cycles', returnCycleId)
  return helpers.serviceRequest.get(url)
}

/**
 * Gets returns for the specified return cycle by ID
 *
 * @param {String} returnCycleId
 * @return {Promise<Object>}
 */
const getReturnCycleReturns = async returnCycleId => {
  const url = urlJoin(config.services.returns, 'return-cycles', returnCycleId, 'returns')
  return helpers.serviceRequest.get(url)
}

exports.returns = returnsClient
exports.versions = versionsClient
exports.lines = linesClient
exports.getActiveReturns = getActiveReturns
exports.getCurrentDueReturns = getCurrentDueReturns
exports.getServiceVersion = getServiceVersion
exports.getReturnsForLicence = getReturnsForLicence
exports.getLinesForReturn = getLinesForReturn
exports.getReturnsCyclesReport = getReturnsCyclesReport
exports.getReturnCycleById = getReturnCycleById
exports.getReturnCycleReturns = getReturnCycleReturns
