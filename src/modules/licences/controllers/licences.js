const Boom = require('@hapi/boom');
const licencesService = require('../../../lib/services/licences');

const getLicence = async (request, h) => {
  const { licenceId } = request.params;
  const licence = await licencesService.getLicenceById(licenceId);
  return licence || Boom.notFound(`Licence ${licenceId} not found`, { licenceId });
};

exports.getLicence = getLicence;
