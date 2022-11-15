const Boom = require('@hapi/boom')
const ExtendableError = require('es6-error')
const {
  returns,
  versions,
  lines
} = require('../../../lib/connectors/returns')

const { mapReturnToVersion, mapReturnToLines, mapReturn } = require('./model-returns-mapper')
const { logger } = require('../../../logger')

class ReturnAPIError extends ExtendableError {
  constructor (obj) {
    const msg = JSON.stringify(obj)
    super(`Return API error ${msg}`)
  }
};

/**
* If the argument passed in is truthy, throws a ReturnAPIError
* @param {Object} error
*/
const throwIfError = error => {
  if (error) {
    throw new ReturnAPIError(error)
  }
}

/**
 * Gets return row from returns API
 * @param {String} returnId
 * @return {Promise} resolves with row of returns data
 */
const fetchReturn = async (returnId) => {
  const filter = {
    return_id: returnId,
    regime: 'water',
    licence_type: 'abstraction'
  }
  const { data: [returnRow], error } = await returns.findMany(filter)
  throwIfError(error)

  if (!returnRow) {
    throw Boom.notFound(`Return ${returnId} not found`)
  }
  return returnRow
}

/**
 * Gets most recent version, or the version with the specified number if present
 * @param {String} returnId
 * @param {Number} [versionNumber] if omitted, the current version is returned
 * @return {Promise} resolves with version row if found
 */
const fetchVersion = async (returnId, versionNumber) => {
  const sort = {
    version_number: -1
  }
  const pagination = {
    perPage: 1
  }
  const filter = {
    return_id: returnId
  }
  if (versionNumber === undefined) {
    filter.current = true
  } else {
    filter.version_number = versionNumber
  }

  try {
    const { data: [versionRow], error } = await versions.findMany(filter, sort, pagination)
    throwIfError(error)

    if (!versionRow) {
      throw Boom.notFound(`Version for ${returnId} not found`)
    }
    return versionRow
  } catch (err) {
    // Handle case where no version exists for this return ID
    if (err.isBoom && err.output.statusCode === 404) {
      return null
    }
    // Rethrow
    throw err
  }
}

/**
 * Get a list of all versions of a return, sorted by version number
 * @TODO support pagination
 * @param {String} returnId
 * @return {Promise} resolves with list of versions
 */
const fetchAllVersions = async (returnId) => {
  const filter = {
    return_id: returnId
  }
  const sort = {
    version_number: +1
  }

  const { data, error } = await versions.findMany(filter, sort)
  throwIfError(error)

  return data
}

/**
 * Fetch line data from return
 * @param {String} returnId
 * @param {String} versionId
 * @return {Promise} resolves with line data
 */
const fetchLines = async (returnId, versionId) => {
  const sort = {
    start_date: +1
  }
  const filter = {
    version_id: versionId
  }
  const pagination = {
    perPage: 366
  }
  const { data, error } = await lines.findMany(filter, sort, pagination)
  if (error) {
    const params = { returnId, versionId }
    logger.error('Failed to fetch lines for return', error.stack, params)
    throw Boom.boomify(error)
  }
  return data
}

/**
 * Persists water service return model to return service
 * @param {Object} ret - return model
 * @return {Promise} resolves when saved successfully
 */
const persistReturnData = async (ret) => {
  let linesData

  logger.info(`start: persistReturnData with return id ${ret.returnId}`)

  // Update the return
  const r = mapReturn(ret)
  const { data: returnData, error: returnError } = await returns.updateMany({ return_id: ret.returnId }, r)
  throwIfError(returnError)

  // Update the version
  const version = mapReturnToVersion(ret)
  const { data: versionData, error: versionError } = await versions.create(version)
  throwIfError(versionError)

  // Update the lines
  const lineRows = mapReturnToLines(ret, versionData)
  if (lineRows) {
    const { data, error: linesError } = await lines.create(lineRows)
    linesData = data
    throwIfError(linesError)
  }

  logger.info(`finish: persistReturnData with return id ${ret.returnId}`)

  return {
    return: returnData,
    version: versionData,
    lines: linesData
  }
}

/**
 * Updates return row data - status, received date
 * @param {Object} ret - return model
 * @return {Promise} resolves when saved successfully
 */
const patchReturnData = async (ret) => {
  const { returnId } = ret

  const { data, error } = await returns.updateOne(returnId, mapReturn(ret))

  throwIfError(error)

  return data
}

module.exports = {
  fetchReturn,
  fetchVersion,
  fetchAllVersions,
  fetchLines,
  persistReturnData,
  patchReturnData,
  ReturnAPIError,
  throwIfError
}
