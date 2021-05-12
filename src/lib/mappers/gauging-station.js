'use strict';

const GaugingStation = require('../models/gauging-station');

const csvToModel = data => {
  const gaugingStation = new GaugingStation();

  /* eslint-disable */
  const {
    hydrology_station_id,
    station_reference,
    wiski_id,
    label,
    lat,
    long,
    easting,
    northing,
    grid_reference,
    catchment_name,
    river_name
  } = data;
  /* eslint-enable */

  // eslint-disable-next-line camelcase
  const hydrologyStationId = hydrology_station_id && hydrology_station_id.length === 36 ? hydrology_station_id : null;

  return gaugingStation.fromHash({
    hydrologyStationId,
    stationReference: station_reference,
    wiskiId: wiski_id,
    label: label || 'Unnamed Gauging Station',
    lat: parseFloat(lat),
    long: parseFloat(long),
    easting: parseFloat(easting),
    northing: parseFloat(northing),
    gridReference: grid_reference,
    catchmentName: catchment_name,
    riverName: river_name
  });
};

exports.csvToModel = csvToModel;
