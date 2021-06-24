const { identity, omit, startCase } = require('lodash');

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

/*
 * This function goes through the object it is given, and
 * it looks for an 'abstractionPeriod' object.
 * If it finds one, it renames the individual parameters to
 * have them prefixed with 'abstractionPeriod' to fit the DB schema
 */
const abstractionPeriodInObjectParser = inputObject => {
  // Create a replica of the input
  const replicatedObject = omit(inputObject, 'abstractionPeriod');

  // If the input doesn't have an abstractionPeriod sub-object, no action is taken.
  if (inputObject.abstractionPeriod) {
    // For each item in the abstractionPeriod subobject...
    for (const [key, value] of Object.entries(inputObject.abstractionPeriod)) {
      // Take the first letter of the item's label, and make it uppercase. Then bung 'abstractionPeriod' in front of it
      replicatedObject[`abstractionPeriod${startCase(key[0])}${key.slice(1)}`] = value;
    }
    return replicatedObject;
  }
  return replicatedObject;
};

exports.gaugingStationsCSVHeaders = gaugingStationsCSVHeaders;
exports.getGaugingStationForUpdate = getGaugingStationForUpdate;
exports.abstractionPeriodInObjectParser = abstractionPeriodInObjectParser;
