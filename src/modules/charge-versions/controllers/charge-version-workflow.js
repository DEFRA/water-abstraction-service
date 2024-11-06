'use strict'

const Boom = require('@hapi/boom')

const chargeVersionsWorkflowService = require('../services/charge-version-workflows')
const licencesService = require('../../../lib/services/licences')
const system = require('../../../lib/connectors/system/workflow-supplementary-billing.js')

const controller = require('../../../lib/controller')
const userMapper = require('../../../lib/mappers/user')
const mapErrorResponse = require('../../../lib/map-error-response')
const { logger } = require('../../../logger')
/**
 * Gets all charge version workflow or
 * those for the given licence id
 * @param {String} request.query.licenceId
 */
const getChargeVersionWorkflows = async request => {
  const { licenceId, page, perPage, tabFilter } = request.query
  if (licenceId) {
    return { data: await chargeVersionsWorkflowService.getManyByLicenceId(licenceId) }
  } else if (tabFilter) {
    return chargeVersionsWorkflowService.getAllWithLicenceHolderWithPaging(tabFilter, page, perPage)
  } else {
    return chargeVersionsWorkflowService.getAllWithLicenceHolder()
  }
}

/**
 * Get a specific charge version workflow by ID
 * @param {String} request.params.chargeVersionWorkflowId
 */
const getChargeVersionWorkflow = request =>
  controller.getEntity(request.params.chargeVersionWorkflowId, chargeVersionsWorkflowService.getByIdWithLicenceHolder)

/**
 * Creates a new charge version workflow record
 * @param {String} request.payload.licenceId - the licence for the new charge version
 * @param {ChargeVersion} request.pre.chargeVersion
 * @param {User} request.pre.user
 */
const postChargeVersionWorkflow = async request => {
  const { licenceId } = request.payload
  const { chargeVersion, user } = request.pre

  chargeVersion.status = 'draft'

  // Find licence or 404
  const licence = await licencesService.getLicenceById(licenceId)
  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`)
  }

  return chargeVersionsWorkflowService.create(licence, chargeVersion, user)
}

/**
 * Updates a charge version workflow record
 * @param {String} [request.payload.status]
 * @param {String} [request.payload.approverComments]
 * @param {Object} [request.payload.chargeVersion]
 */
const patchChargeVersionWorkflow = async (request, h) => {
  const { chargeVersionWorkflowId } = request.params
  const { approverComments, status, createdBy } = request.payload
  const { chargeVersion } = request.pre

  const changes = {
    ...request.payload,
    ...chargeVersion && { chargeVersion }
  }
  if (createdBy) {
    try {
      changes.createdBy = userMapper.pojoToModel(createdBy)
    } catch (err) {
      logger.error('Error mapping user', err.stack)
      return Boom.badData('Invalid user in charge version data')
    }
  }
  try {
    if (status === 'changes_requested') {
      const chargeVersionWorkflow = await chargeVersionsWorkflowService.update(chargeVersionWorkflowId, { ...changes, approverComments, status })
      return chargeVersionWorkflow
    } else {
      const chargeVersionWorkflow = await chargeVersionsWorkflowService.update(chargeVersionWorkflowId, changes)
      return chargeVersionWorkflow
    }
  } catch (err) {
    return mapErrorResponse(err)
  }
}

const deleteChargeVersionWorkflow = async (request, h) => {
  const { chargeVersionWorkflow } = request.pre

  try {
    // Licences in workflow get excluded from billing. This means when we delete a workflow record we need to check if
    // that licence has missed any annual bill runs and therefore needs to be flagged for supplementary billing
    // We do this by making a call to the system repo that handles all the logic for supplementary billing flags.
    // This route is only deleting workflow records that have either been removed by the user or the charge version has
    // not been approved. This does not cover charge versions being approved. That happens elsewhere.
    await system.workflowFlagSupplementaryBilling(chargeVersionWorkflow.id)
    await chargeVersionsWorkflowService.delete(chargeVersionWorkflow)

    return h.response().code(204)
  } catch (error) {
    logger.error('Flag supplementary request to system failed', error.stack)

    return mapErrorResponse(error)
  }
}

exports.getChargeVersionWorkflows = getChargeVersionWorkflows
exports.getChargeVersionWorkflow = getChargeVersionWorkflow
exports.postChargeVersionWorkflow = postChargeVersionWorkflow
exports.patchChargeVersionWorkflow = patchChargeVersionWorkflow
exports.deleteChargeVersionWorkflow = deleteChargeVersionWorkflow
