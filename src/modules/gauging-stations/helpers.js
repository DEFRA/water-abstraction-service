const { identity } = require('lodash');

const getGaugingStationForUpdate = (Station, gaugingStationsInDb) => {
  const stationInDbWithMatchingHydrologyGuid = gaugingStationsInDb
    .find(station => station.hydrologyStationId && station.hydrologyStationId === Station.hydrologyStationId);

  const stationInDbWithMatchingStationReference = gaugingStationsInDb
    .find(station => station.stationReference && station.stationReference === Station.stationReference);

  const stationInDbWithMatchingWiskiId = gaugingStationsInDb
    .find(station => station.wiskiId && station.wiskiId === Station.wiskiId);

  return [stationInDbWithMatchingHydrologyGuid, stationInDbWithMatchingStationReference, stationInDbWithMatchingWiskiId]
    .map(res => res ? res.gaugingStationId : undefined).find(identity);
};

const gaugingStationsCSVHeaders = [
  'hydrology_station_id',
  'station_reference',
  'wiski_id',
  'label',
  'lat',
  'long',
  'easting',
  'northing',
  'grid_reference',
  'catchment_name',
  'river_name'
];

exports.gaugingStationsCSVHeaders = gaugingStationsCSVHeaders;
exports.getGaugingStationForUpdate = getGaugingStationForUpdate;
