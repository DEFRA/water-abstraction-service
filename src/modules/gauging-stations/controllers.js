const gaugingStationsRepo = require('../../lib/connectors/repos/gauging-stations');
const Boom = require('@hapi/boom');

const getGaugingStation = async request => {
  const { stationGuid } = request.params;
  const gaugingStation = await gaugingStationsRepo.findOne(stationGuid);
  return gaugingStation || Boom.notFound(`Gauging station ${stationGuid} not found`);
};

exports.getGaugingStation = getGaugingStation;
