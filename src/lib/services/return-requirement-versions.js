'use strict'

const returnVersionsRepo = require('../connectors/repos/return-versions')
const returnVersionMapper = require('../mappers/return-requirement-version')
const service = require('./service')

/**
 * Gets a list of all return requirement versions for the supplied licence ID
 * @param {String} licenceId
 * @return {Array<ReturnRequirementVersion>}
 */
const getByLicenceId = licenceId =>
  service.findMany(
    licenceId,
    returnVersionsRepo.findByLicenceId,
    returnVersionMapper
  )

exports.getByLicenceId = getByLicenceId
