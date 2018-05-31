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

    console.log('Importing ' + station['@id']);

    const row = {
      id: station['@id'],
      label: station.label,
      lat: 'lat' in station ? parseFloat(station.lat) : null,
      long: 'long' in station ? parseFloat(station.long) : null,
      easting: 'easting' in station ? parseInt(station.easting) : null,
      northing: 'northing' in station ? parseInt(station.northing) : null,
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

    const { error } = await repository.create(row);

    if (error) {
      // console.error(station['@id'], error);
      errors.push(station['@id'] + ' ' + error.toString());
    }
  }

  return { error: errors.length ? errors : null };
}

module.exports = { refreshStations };
