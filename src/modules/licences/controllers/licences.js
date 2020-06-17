'use strict';

const Boom = require('@hapi/boom');

const licencesService = require('../../../lib/services/licences');

const getLicence = async request => {
  const { licenceId } = request.params;
  const licence = await licencesService.getLicenceById(licenceId);
  return licence || Boom.notFound(`Licence ${licenceId} not found`, { licenceId });
};

const getLicenceVersions = async request => {
  return licencesService.getLicenceVersions(request.params.licenceId);
};

exports.getLicence = getLicence;
exports.getLicenceVersions = getLicenceVersions;
