'use strict'

const mapErrorResponse = require('../../../lib/map-error-response')
const { pick } = require('lodash')

const licenceAgreementsService = require('../../../lib/services/licence-agreements')
const controller = require('../../../lib/controller')

const getAgreement = async request =>
  controller.getEntity(request.params.agreementId, licenceAgreementsService.getLicenceAgreementById)

const patchAgreement = async request => {
  const { agreementId } = request.params
  const { internalCallingUserModel: issuer } = request.defra
  try {
    return licenceAgreementsService.patchLicenceAgreement(agreementId, request.payload, issuer)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Get all licence agreements for the specified licence
 * @param {Licence} request.pre.licence
 */
const getLicenceAgreements = async request => {
  const { licence } = request.pre
  return licenceAgreementsService.getLicenceAgreementsByLicenceRef(licence.licenceNumber)
}

const deleteAgreement = async (request, h) => {
  const { agreementId } = request.params
  const { internalCallingUserModel: issuer } = request.defra
  try {
    // Delete the licence agreement
    await licenceAgreementsService.deleteLicenceAgreementById(agreementId, issuer)

    return h.response().code(204)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

/**
 * Adds a new licence agreement to an existing licence
 */
const postLicenceAgreement = async (request, h) => {
  const { licence } = request.pre
  const { internalCallingUserModel: issuer } = request.defra
  const data = pick(request.payload, ['code', 'startDate', 'dateSigned'])

  try {
    const model = await licenceAgreementsService.createLicenceAgreement(licence, data, issuer)

    return h.response(model).code(201)
  } catch (err) {
    return mapErrorResponse(err)
  }
}

exports.getAgreement = getAgreement
exports.patchAgreement = patchAgreement
exports.getLicenceAgreements = getLicenceAgreements
exports.deleteAgreement = deleteAgreement
exports.postLicenceAgreement = postLicenceAgreement
