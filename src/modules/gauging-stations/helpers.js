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

const measurementPoint = data => {
  if (data.measurement_point_type == 'Upstream') {
    return 'immediately upstream of the authorised point of abstraction,';
  }
  if (data.measurement_point_type == 'Downstream') {
    return 'immediately downstream of the authorised point of abstraction,';
  }
  if (data.measurement_point_type == 'NGR' && data.measurement_point_place) {
    return `at National Grid Reference ${data.measurement_point_ngr},`;
  }

  if (data.measurement_point_type === 'Borehole') {
    return 'in the borehole,';
  }

  if (data.measurement_point_diagram_type === 'Map') {
    return `marked as ${data.measurement_point_reference} on the map`;
  }
  if (data.measurement_point_diagram_type === 'Drawing') {
    return `and on drawing ${data.measurement_point_drawing_name} dated ${data.measurement_point_drawing_date}`;
  }
};

const getDigitiseText = (schema, data) => {
  if (schema === '/wr22/2.1') {
    return `No abstraction shall take place unless the level of water in the ${data.water_body_name.name}
as measured ${measurementPoint(data.measurement_point)}is equal to or greater than ${data.hol_rate_level}${data.unit} 
and the abstraction shall not cause the level at the said ${data.point} to fall below that level.`;
  }

  if (schema === '/wr22/2.2') {
    return `Abstraction shall not exceed ${data.max_rate}${data.max_rate_unit} ${data.rate_type}
when the level in the ${data.water_body_name.name} as measured ${measurementPoint(data.measurement_point)} 
is equal to or greater than ${data.hol_rate_level}${data.hol_rate_level_unit}.`;
  }

  if (schema === '/wr22/2.3') {
    const abstractionPoint = data.measurement_point.measurement_point_diagram_type == 'None' ? 'abstraction point' : 'reference point';
    return `No ${data.purpose_type == 'Abstraction' ? 'abstraction' : 'power production'} shall
 take place unless the rate of flow in the ${data.water_body_name.name} as measured ${measurementPoint(data.measurement_point)} 
 is equal to or greater than ${data.hof_hol_flow}${data.hof_hol_flow_unit} and the 
 ${data.purpose_type == 'Abstraction'
      ? 'abstraction' : (
        data.purpose_type == 'Power production' ? 'power production' : 'turbine'
      )} shall not cause the ${data.hof_type == 'Hands off flow' ? `flow immediately downstream of the said ${abstractionPoint} 
      to fall below that rate.` : `water level at of the said ${abstractionPoint} to fall below that level.`} 
 This shall be known as the ${data.hof_type}.`;
  }

  if (schema === '/wr22/2.4') {
    return `The quantity of water ${data.purpose_type === 'Abstraction' ? 'abstracted' : 'used for power production'} shall
 not exceed { data.max_percentage } percent of the available flow in the ${data.water_body_name.name} in excess of the hands off flow.`;
  }

  if (schema === '/wr22/2.5') {
    return `No abstraction shall take place when the flow in the ${data.water_body_name.name}
as gauged by the Agency at its flow gauging station at ${data.gauging_station.value}
is equal to or less than ${data.max_rate}${data.max_rate_unit}
as may be notified by the Agency. The Agency’s said gauging of the flow shall be conclusive.`;
  }

  if (schema === '/wr22/2.6') {
    return `Abstraction shall not exceed ${data.max_rate}${data.max_rate_unit}
 when the flow in the ${data.water_body_name.name} as gauged by the Agency at its flow gauging station at 
${data.gauging_station.value} is equal to or less than ${data.hof_rate}${data.hof_rate_unit} for ${data.hof_duration}
as may be notified by the Agency. The Agency’s said gauging of the flow shall be conclusive.`;
  }

  if (schema === '/wr22/2.7') {
    return `The quantity of water abstracted shall not exceed ${data.max_percentage} of
  the available flow in the ${data.water_body_name.name} in excess of ${data.max_rate}${data.unit}.`;
  }

  if (schema === '/wr22/2.8') {
    return `The rate of flow of ${data.max_rate}${data.unit}
        shall be delivered via a ${data.delivery_method} located at ${data.ngr}.`;
  }

  if (schema === '/wr22/2.9.4') {
    return `Denver – New Licences Only:  In this provision the ‘Combined Flow’ shall mean the sum of the flows of water
      in the Ely Ouse River and the Cut-Off Channel as measured by the Agency at the
      Denver Complex at National Grid Reference TF 58807 00990. Main River (in South Level). No water shall be 
      abstracted from the ${data.location} when the Licence
      Holder has been notified by the Agency in writing that the combined flow is
      EQUAL to or LESS than 12 cubic metres per second.`;
  }

  if (schema === '/wr22/2.9.8') {
    return `Lakenheath IDB: No water shall be taken at ${data.abstraction_point} when the water
      level in Lakenheath Poor’s Fen is EQUAL TO or LESS THAN 99.8 metres South
      Level Datum, as indicated by the red triangle on the gauging board on the
      drain at National Grid Reference TL 7003 8386.`;
  }
};

exports.gaugingStationsCSVHeaders = gaugingStationsCSVHeaders;
exports.getGaugingStationForUpdate = getGaugingStationForUpdate;
exports.abstractionPeriodInObjectParser = abstractionPeriodInObjectParser;
exports.getDigitiseText = getDigitiseText;
