const gaugingStationsRepo = require('../../lib/connectors/repos/gauging-stations');

const getGaugingStation = request => {
  const { stationGuid } = request.params;
  return gaugingStationsRepo.findOne(stationGuid);
};

exports.getGaugingStation = getGaugingStation;
