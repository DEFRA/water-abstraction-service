'use strict'

const licencesService = require('../../../lib/services/licences')
const Boom = require('@hapi/boom')

/**
 * Pre handler to get licence by ID
 * @param {Object} request
 * @param {String} request.params.licenceId
 * @return {Licence|Boom} licence service model or Boom not found error
 */
const getLicence = async request => {
  const { licenceId } = request.params
  const licence = await licencesService.getLicenceById(licenceId)
  return licence || Boom.notFound(`Licence ${licenceId} not found`)
}

exports.getLicence = getLicence
