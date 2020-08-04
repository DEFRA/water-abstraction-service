'use strict';

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

exports.getAgreement = getAgreement;
exports.getLicenceAgreements = getLicenceAgreements;
