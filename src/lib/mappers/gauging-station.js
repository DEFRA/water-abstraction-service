'use strict';

const GaugingStation = require('../models/gauging-station');

const csvToModel = data => {
  const gaugingStation = new GaugingStation();

  return gaugingStation.fromHash({
    hydrologyStationId: data.hydrology_station_id.length === 36 ? data.hydrology_station_id : null,
    stationReference: data.station_reference || null,
    wiskiId: data.wiski_id || null,
    label: data.label || 'Unnamed Gauging Station',
    lat: parseFloat(data.lat) || null,
    long: parseFloat(data.long) || null,
    easting: parseFloat(data.easting) || null,
    northing: parseFloat(data.northing) || null,
    gridReference: data.grid_reference || null,
    catchmentName: data.catchment_name || null,
    riverName: data.river_name || null
  });
};

exports.csvToModel = csvToModel;
