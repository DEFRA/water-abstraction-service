'use strict'

const returnRequirementsRepo = require('../connectors/repos/return-requirements')
const returnRequirementsMapper = require('../mappers/return-requirement')

const service = require('./service')

/**
 * Gets a ReturnRequirement service model by external ID
 * @param {String} externalId - NALD external ID, in the form regionCode:returnReference
 * @return {Promise<ReturnRequirement>}
 */
const getReturnRequirementByExternalId = async externalId => service.findOne(externalId, returnRequirementsRepo.findOneByExternalId, returnRequirementsMapper)

const getReturnRequirementById = async id => service.findOne(id, returnRequirementsRepo.findOneById, returnRequirementsMapper)

exports.getReturnRequirementByExternalId = getReturnRequirementByExternalId
exports.getReturnRequirementById = getReturnRequirementById
