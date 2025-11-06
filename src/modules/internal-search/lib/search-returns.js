'use strict'

const helpers = require('@envage/water-abstraction-helpers')
const { groupBy } = require('../../../lib/object-helpers')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const returnsService = require('../../../lib/connectors/returns')
const { isReturnId } = require('./query-parser')

/**
 * Maps single return
 * @param  {Object} row - return row
 * @return {Object}     - mapped return row
 */
const mapReturn = (row) => {
  const { metadata, ...rest } = row
  const regionCode = metadata.nald.regionCode
  const region = helpers.regions.getRegion(regionCode)
  return {
    ...rest,
    region
  }
}

/**
 * Finds return by return ID
 * @param  {String}  returnId - the return service return ID
 * @return {Promise}          - resolves with return data
 */
const findReturnByReturnId = async (returnId) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_id: returnId
  }
  const response = await returnsService.returns.findMany(filter)
  throwIfError(response.error)
  return response.data
}

/**
 * Given an array of returns which may be in various regions, but which
 * are already sorted by reverse end date, returns an array with only
 * the most recent return in each NALD region
 * @param  {Array} returns - list of returns sorted by reverse end date
 * @return {Array}         - a list of the most recent return in each region
 */
const mapRecentReturns = (returns) => {
  // Group results by NALD region code
  const grouped = groupBy(returns, ret => ret.metadata.nald.regionCode)

  // Discard all but last item in each group
  const filtered = {}
  for (const group in grouped) {
    filtered[group] = grouped[group][0]
  }

  // Return the values from each group as array
  return Object.values(filtered)
}

/**
 * Finds recent returns by format ID
 * Return formats are split across regions, so may not be unique.  We therefore
 * get all returns for the specified format ID, and then group them by
 * region code before getting the most recent
 * @param  {String}  formatId - formatId - return_requirement field in returns service
 * @return {Promise}          Resolves with array of returns
 */
const findRecentReturnsByFormatId = async (formatId) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    return_requirement: formatId
  }
  const sort = {
    end_date: -1
  }
  const columns = [
    'id', 'return_id', 'licence_ref', 'return_requirement',
    'end_date', 'metadata', 'status', 'due_date'
  ]

  const returns = await returnsService.returns.findAll(filter, sort, columns)

  return mapRecentReturns(returns)
}

/**
 * Searches returns either by return ID (if detected) or format ID
 * @param  {String}  query - format ID or full return ID
 * @return {Promise}       - resolves with array of returns
 */
const searchReturns = async (query) => {
  const finder = isReturnId(query) ? findReturnByReturnId : findRecentReturnsByFormatId
  const returns = await finder(query)

  return returns.map(mapReturn)
}

exports.mapReturn = mapReturn
exports.searchReturns = searchReturns
exports.findReturnByReturnId = findReturnByReturnId
exports.findRecentReturnsByFormatId = findRecentReturnsByFormatId
exports.mapRecentReturns = mapRecentReturns
