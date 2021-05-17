const { identity } = require('lodash');

const getGaugingStationForUpdate = (station, gaugingStationsInDb) => {
  const stationInDbWithMatchingHydrologyGuid = gaugingStationsInDb
    .find(eachStation => eachStation.hydrologyStationId && eachStation.hydrologyStationId === station.hydrologyStationId);

  const stationInDbWithMatchingStationReference = gaugingStationsInDb
    .find(eachStation => eachStation.stationReference && eachStation.stationReference === station.stationReference);

  const stationInDbWithMatchingWiskiId = gaugingStationsInDb
    .find(eachStation => eachStation.wiskiId && eachStation.wiskiId === station.wiskiId);

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
