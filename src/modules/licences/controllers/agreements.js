'use strict';

const Boom = require('@hapi/boom');

const licencesService = require('../../../lib/services/licences');

const getAgreement = async request => {
  const { agreementId } = request.params;
  const agreement = await licencesService.getLicenceAgreementById(agreementId);
  return agreement || Boom.notFound(`Agreement ${agreementId} not found`, { agreementId });
};

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
