'use strict'

/**
 * @module a service to transform and decorate data loaded from the returns service
 *         to Return service models
 */

const { logger } = require('../../../logger.js')

// Services
const returnRequirementsService = require('../return-requirements')
const returnMapper = require('../../mappers/return')

/**
 * Given a list of returns loaded from the returns service, fetches the
 * return requirements from water.return_requirements as service models
 * @param {Array<Object>} returnsData
 * @return {Array<ReturnRequirement>}
 */
const getReturnRequirements = returnsData => {
  // Get a unique list of return requirement IDs
  // Create a new set to remove any duplicate values
  const returnRequirementIds = _returnRequirementIds(returnsData)

  const tasks = returnRequirementIds.map(returnRequirementsService.getReturnRequirementById)

  return Promise.all(tasks)
}

function _returnRequirementIds (returnsData) {
  const ids = returnsData.map((returnData) => {
    return returnData.return_requirement_id
  })

  return [...new Set(ids)]
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
  const returnRequirementId = returnData.returnRequirementId

  let returnRequirement

  try {
    returnRequirement = returnRequirements.find((o) => o.returnRequirementId === returnRequirementId)
  } catch (error) {
    logger.error(`Error finding return requirement ${returnRequirementId} in mapping service`, error.stack)
  }

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
