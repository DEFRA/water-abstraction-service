const { get } = require('lodash');
const { repository: gaugingStationsRepo } = require('../../../controllers/gauging-stations');

const mapGaugingStation = (row) => {
  return {
    name: row.label,
    gridReference: row.grid_reference,
    stationReference: row.station_reference
  };
};

/**
 * Given a row of licence data from the permit repo, finds gauging station
 * data stored locally in the gauging_stations DB table and format
 * If gauging stations are linked, the station references are stored in the
 * licence metadata column
 * @param  {Object}  licence - licence row from permit repo
 * @return {Promise}         - resolves with rows of data from the gauging_stations DB table
 */
const getGaugingStations = async (licence) => {
  const gaugingStations = get(licence, 'metadata.gaugingStations', []);

  const stationReferences = gaugingStations.map(row => row.stationReference);

  if (stationReferences.length === 0) {
    return [];
  }

  // Load gauging station data
  const filter = {
    station_reference: {
      $in: stationReferences
    }
  };

  const { rows } = await gaugingStationsRepo.find(filter);

  return rows;
};

module.exports = {
  mapGaugingStation,
  getGaugingStations
};
