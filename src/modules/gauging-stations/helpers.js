const { identity } = require('lodash');

const getGaugingStationForUpdate = (mappedGaugingStation, gaugingStationsInDb) => {
  const stationInDbWithMatchingHydrologyStationId = gaugingStationsInDb.find(station => {
    return station.hydrologyStationId && station.hydrologyStationId === mappedGaugingStation.hydrologyStationId;
  });
  const stationInDbWithMatchingStationReference = gaugingStationsInDb.find(station => station.stationReference && station.stationReference === mappedGaugingStation.stationReference);
  const stationInDbWithMatchingWiskiId = gaugingStationsInDb.find(station => station.wiskiId && station.wiskiId === mappedGaugingStation.wiskiId);
  return [stationInDbWithMatchingHydrologyStationId, stationInDbWithMatchingStationReference, stationInDbWithMatchingWiskiId].map(res => res ? res.gaugingStationId : undefined).find(identity);
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
