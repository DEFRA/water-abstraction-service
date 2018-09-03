const moment = require('moment');

const {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  getLogs,
  getLogsForPeriod
} = require('./lib/nald-returns-queries.js');

const {
  mapPeriod,
  formatReturnMetadata,
  getFormatCycles,
  getCurrentCycles,
  mapReceivedDate,
  getReturnId
} = require('./lib/transform-returns-helpers.js');

/**
 * @param {String} licenceNumber - the abstraction licence number
 * @param {String} currentVersionStart - the start date of the current version of the licence in format DD/MM/YYYY
 */
const buildReturnsPacket = async (licenceNumber, currentVersionStart) => {
  // Create moment for the start date of the current licence version
  const versionStartDate = currentVersionStart ? moment(currentVersionStart, 'DD/MM/YYYY') : null;

  const formats = await getFormats(licenceNumber);

  // Load format data
  for (let format of formats) {
    format.purposes = await getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await getFormatPoints(format.ID, format.FGAC_REGION_CODE);
    format.logs = await getLogs(format.ID, format.FGAC_REGION_CODE);
    format.cycles = getCurrentCycles(getFormatCycles(format), versionStartDate);
  }

  const returnsData = {
    returns: []
  };

  for (let format of formats) {
    for (let cycle of format.cycles) {
      const { startDate, endDate, isCurrent } = cycle;

      // Get all form logs relating to this cycle
      const cycleLogs = await getLogsForPeriod(format.ID, format.FGAC_REGION_CODE, startDate, endDate);

      const returnId = getReturnId(licenceNumber, format, startDate, endDate);

      // Create new return row
      const returnRow = {
        return_id: returnId,
        regime: 'water',
        licence_type: 'abstraction',
        licence_ref: licenceNumber,
        start_date: startDate,
        end_date: endDate,
        returns_frequency: mapPeriod(format.ARTC_REC_FREQ_CODE),
        status: 'complete',
        source: 'NALD',
        metadata: JSON.stringify({
          ...formatReturnMetadata(format),
          isCurrent
        }),
        received_date: mapReceivedDate(cycleLogs)
      };

      returnsData.returns.push(returnRow);
    }
  }

  return returnsData;
};

module.exports = {
  buildReturnsPacket
};
