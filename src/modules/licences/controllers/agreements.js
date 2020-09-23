'use strict';

const eventHelper = require('../lib/event-helper');
const mapErrorResponse = require('../../../lib/map-error-response');
const Boom = require('@hapi/boom');

const licencesService = require('../../../lib/services/licences');
const controller = require('../../../lib/controller');

const getAgreement = async request =>
  controller.getEntity(request.params.agreementId, licencesService.getLicenceAgreementById);

const getLicenceAgreements = async request => {
  const { licenceId } = request.params;
  const licence = await licencesService.getLicenceById(licenceId);

  if (!licence) {
    return Boom.notFound(`Licence ${licenceId} not found`, { licenceId });
  }

  return licencesService.getLicenceAgreementsByLicenceRef(licence.licenceNumber);
};

const deleteAgreement = async (request, h) => {
  const { agreementId } = request.params;
  const { email: issuer } = request.defra.internalCallingUser;
  try {
    // Get licence agreement to save in event metadata
    const licenceAgreement = await licencesService.getLicenceAgreementById(agreementId);

    if (!licenceAgreement) {
      return Boom.notFound(`Agreement ${agreementId} not found`);
    }

    // Delete the licence agreement
    await licencesService.deleteLicenceAgreementById(agreementId);

    // log deletion in event log
    await eventHelper.saveEvent(
      'licence-agreement:delete',
      null,
      [],
      'delete',
      issuer,
      { licenceAgreement }
    );

    return h.response().code(204);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

exports.getAgreement = getAgreement;
exports.getLicenceAgreements = getLicenceAgreements;
exports.deleteAgreement = deleteAgreement;
