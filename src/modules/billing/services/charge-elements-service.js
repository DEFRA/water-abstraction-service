const repos = require('../../../lib/connectors/repository')
const mappers = require('../mappers')

/**
 * Gets a single charge element model by ID
 * @param {String} chargeElementId - GUID
 * @return {Promise<ChargeElement>}
 */
const getById = async chargeElementId => {
  const data = await repos.chargeElements.findOneById(chargeElementId)
  return mappers.chargeElement.dbToModel(data)
}

exports.getById = getById
