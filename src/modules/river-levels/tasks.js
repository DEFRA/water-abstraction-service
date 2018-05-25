const { getAllStations } = require('../../lib/connectors/river-levels');
const { repository } = require('../../controllers/gauging-stations.js');
const moment = require('moment');
const ngrConverter = require('./ngr-converter');

/**
 * Calls the river levels API and updates list of stations locally
 * @return {Promise} resolves when refresh operation complete with { error : [...]}
 */
async function refreshStations () {
  const data = await getAllStations();

  const errors = [];

  for (let station of data.items) {
    const ts = moment().format('YYYY-MM-DD HH:mm:ss');

    const row = {
      id: station['@id'],
      label: station.label,
      lat: parseFloat(station.lat),
      long: parseFloat(station.long),
      easting: parseInt(station.easting),
      northing: parseInt(station.northing),
      grid_reference: station.gridReference || ngrConverter(station.easting, station.northing),
      catchment_name: station.catchmentName || '',
      river_name: station.riverName || '',
      wiski_id: station.wiskiID,
      station_reference: station.stationReference,
      status: station.status,
      metadata: JSON.stringify(station),
      created: ts,
      modified: ts
    };

    console.log(row);

    const { error } = repository.create(row);

    if (error) {
      errors.push(error);
    }
  }

  return { error: errors.length ? errors : null };
}

module.exports = { refreshStations };
