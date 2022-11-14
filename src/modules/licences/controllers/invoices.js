'use strict'
const licencesService = require('../../../lib/services/licences')
const { logger } = require('../../../logger')
const mapErrorResponse = require('../../../lib/map-error-response')

const getLicenceInvoices = async request => {
  const { licenceId } = request.params
  const { page, perPage } = request.query
  try {
    return licencesService.getLicenceInvoices(licenceId, page, perPage)
  } catch (error) {
    logger.error('Failed to get bills for licence', error.stack, { licenceId })
    return mapErrorResponse(error)
  }
}

exports.getLicenceInvoices = getLicenceInvoices
