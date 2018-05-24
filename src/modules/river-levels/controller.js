const riverLevels = require('../../lib/connectors/river-levels');
const ngrConverter = require('./ngr-converter');
const { isArray } = require('lodash');

function getMeasure (measures) {
  if (isArray(measures)) {
    return measures.find(row => row.parameter === 'level');
  }
  return measures;
}

/**
 * Get latest measurement data for gauging station with the given ID
 * @param {String} request.params.id - gauging station ID
 */
async function getStation (request, reply) {
  const { id } = request.params;

  try {
    // Get data from river levels API
    const data = await riverLevels.getStation(id);
    const { lat, long, easting, northing, eaAreaName, eaRegionName, label, catchmentName, riverName, measures } = data.items;
    const measure = getMeasure(measures);
    const { latestReading, unitName } = measure;

    // Convert easting/northing to NGR
    const ngr = ngrConverter(easting, northing);

    reply({
      lat,
      long,
      ngr,
      catchmentName,
      riverName,
      eaAreaName,
      eaRegionName,
      label,
      latestReading,
      unitName
    });
  } catch (error) {
    console.error(error);
    reply({ error: 'River levels API error' }).code(error.statusCode);
  }
}

module.exports = {
  getStation
};
