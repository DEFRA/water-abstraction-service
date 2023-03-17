'use strict'

/**
 * @module a service to transform and decorate data loaded from the returns service
 *         to Return service models
 */

// Services
const returnRequirementsService = require('../return-requirements')
const returnMapper = require('../../mappers/return')

const getReturnRequirementExternalId = returnData => `${returnData.metadata.nald.regionCode}:${returnData.metadata.nald.formatId}`

/**
 * Given a list of returns loaded from the returns service, fetches the
 * return requirements from water.return_requirements as service models
 * @param {Array<Object>} returnsData
 * @return {Array<ReturnRequirement>}
 */
const getReturnRequirements = returnsData => {
  // Get a unique list of external IDs
  const externalIds = [...new Set(returnsData.map(getReturnRequirementExternalId))]
  const tasks = externalIds.map(returnRequirementsService.getReturnRequirementByExternalId)
  return Promise.all(tasks)
}

/**
 * Given an object of data from returns.returns loaded via the returns module API,
 * and an array of ReturnRequirement instances loaded from water.return_requirements,
 * returns a Return service model
 * @param {Object} returnData
 * @param {Array<ReturnRequirement>} returnRequirements
 * @return {Return}
 */
const mapReturnDataToModel = (returnData, returnRequirements) => {
  const externalId = getReturnRequirementExternalId(returnData)
  const returnRequirement = returnRequirements.find((o) => o.externalId === externalId)
  return returnMapper.returnsServiceToModel(returnData, returnRequirement)
}

/**
 * Given an array of returns loaded from returns.returns loaded via the returns module API,
 * loads the local
 * @param {Array<Object>} returnsData
 */
const mapReturnsToModels = async returnsData => {
  // Load return requirements from local table and map to service models
  const returnRequirements = await getReturnRequirements(returnsData)
  return returnsData.map(ret => mapReturnDataToModel(ret, returnRequirements))
}

exports.mapReturnsToModels = mapReturnsToModels
