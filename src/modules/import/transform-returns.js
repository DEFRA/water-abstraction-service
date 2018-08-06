const moment = require('moment');
const { returnsDateToIso } = require('./lib/date-helpers');
// const { formatAbstractionPoint } = require('../../lib/licence-transformer/nald-helpers');

const {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  // getLogs,
  getLines
} = require('./lib/nald-returns-queries.js');

const {
  // convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  formatReturnMetadata,
  getCycles
} = require('./lib/transform-returns-helpers.js');

/**
 * @param {String} licenceNumber - the abstraction licence number
 * @param {String} currentVersionStart - the start date of the current version of the licence in format DD/MM/YYYY
 */
const buildReturnsPacket = async (licenceNumber, currentVersionStart) => {
  // Create moment for the start date of the current licence version
  const versionStartDate = currentVersionStart ? moment(currentVersionStart, 'DD/MM/YYYY') : null;

  const formats = await getFormats(licenceNumber);

  // Calculate return cycles for formats
  const cycles = getCycles(formats);
  for (let cycle of cycles) {
    cycle.lines = await getLines(cycle.format.ID, cycle.format.FGAC_REGION_CODE, cycle.startDate, cycle.endDate);
  }

  // Get format points/purposes
  for (let format of formats) {
    format.purposes = await getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await getFormatPoints(format.ID, format.FGAC_REGION_CODE);
  }

  const returnsData = {
    returns: [],
    versions: [],
    lines: []
  };

  for (let cycle of cycles) {
    const { format, startDate, endDate } = cycle;
    const returnId = `v1:${format.FGAC_REGION_CODE}:${licenceNumber}:${format.ID}:${startDate}:${endDate}`;

    const isCurrent = versionStartDate && moment(endDate).isAfter(versionStartDate);

    // Create new return row
    const returnRow = {
      return_id: returnId,
      regime: 'water',
      licence_type: 'abstraction',
      licence_ref: licenceNumber,
      start_date: startDate,
      end_date: endDate,
      returns_frequency: mapFrequency(format.ARTC_REC_FREQ_CODE),
      status: 'complete',
      source: 'NALD',
      metadata: JSON.stringify({
        ...formatReturnMetadata(format),
        isCurrent
      }),
      received_date: '2018-01-01'
    };

    // Create new version row
    const versionRow = {
      version_id: returnId,
      return_id: returnId,
      version_number: 1,
      user_id: 'water-abstraction-service',
      user_type: 'agency',
      metadata: JSON.stringify({
        isCurrent
      }),
      nil_return: false
    };

    returnsData.returns.push(returnRow);
    returnsData.versions.push(versionRow);
    //

    for (let line of cycle.lines) {
      const startDate = getStartDate(line.ARFL_DATE_FROM, line.RET_DATE, format.ARTC_REC_FREQ_CODE);
      const endDate = returnsDateToIso(line.RET_DATE);
      const isCurrent = versionStartDate && moment(startDate).isSameOrAfter(versionStartDate);
      const lineRow = {
        line_id: `${returnId}:${line.ARFL_DATE_FROM}:${startDate}:${endDate}`,
        version_id: returnId,
        substance: 'water',
        quantity: line.RET_QTY === '' ? null : parseFloat(line.RET_QTY),
        unit: mapUnit(line.UNIT_RET_FLAG) || '?',
        start_date: startDate,
        end_date: endDate,
        time_period: mapPeriod(format.ARTC_REC_FREQ_CODE),
        metadata: JSON.stringify({
          isCurrent
        }),
        reading_type: mapUsability(line.RET_QTY_USABILITY)
      };

      returnsData.lines.push(lineRow);
    }
  }

  return returnsData;
};

module.exports = {
  buildReturnsPacket
};
