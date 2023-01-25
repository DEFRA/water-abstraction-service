'use strict'

const chargeVersionMapper = require('../../../lib/mappers/charge-version')
const userMapper = require('../../../lib/mappers/user')
const chargeVersionWorkflowService = require('../services/charge-version-workflows')
const Boom = require('@hapi/boom')
const { logger } = require('../../../logger')

const mapOrThrowBoom = (entityName, data, mapper) => {
  try {
    return mapper.pojoToModel(data)
  } catch (err) {
    logger.error(`Error mapping ${entityName}`, err.stack)
    return Boom.badData('Invalid charge version data')
  }
}

/**
 * Maps a pojo representation of a charge version in the request payload
 * to a ChargeVersion service model
 * If mapping fails, a Boom badData error is returned
 * @param {Object} request.payload.chargeVersion
 * @param {Object} h - hapi response toolkit
 * @return {ChargeVersion} - if mapped
 */
const mapChargeVersion = (request, h) => {
  const { chargeVersion } = request.payload

  return chargeVersion
    ? mapOrThrowBoom('charge version', chargeVersion, chargeVersionMapper)
    : h.continue
}

/**
 * Maps a pojo representation of a user in the request payload
 * to a User service model
 * If mapping fails, a Boom badData error is returned
 * @param {Object} request.defra.internalCallingUser
 * @param {Object} h - hapi response toolkit
 * @return {User} - if mapped
 */
const mapInternalCallingUser = (request, h) => {
  const internalCallingUser = request.defra.internalCallingUser ? request.defra.internalCallingUser : null
  return mapOrThrowBoom('user', internalCallingUser, userMapper)
}

const loadChargeVersionWorkflow = async request => {
  const { chargeVersionWorkflowId } = request.params
  const chargeVersionWorkflow = await chargeVersionWorkflowService.getById(chargeVersionWorkflowId)

  if (!chargeVersionWorkflow) {
    return Boom.notFound(`No charge version workflow found with id: ${chargeVersionWorkflowId}`)
  }

  return chargeVersionWorkflow
}

exports.mapChargeVersion = mapChargeVersion
exports.mapInternalCallingUser = mapInternalCallingUser
exports.loadChargeVersionWorkflow = loadChargeVersionWorkflow
