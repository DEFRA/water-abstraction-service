const {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  getLogsForPeriod,
  getSplitDate
} = require('./lib/nald-returns-queries.js');

const {
  mapPeriod,
  formatReturnMetadata,
  getFormatCycles,
  mapReceivedDate,
  getReturnId,
  getStatus,
  getDueDate
} = require('./lib/transform-returns-helpers.js');

/**
 * Loads licence formats from DB
 * @param {String} licenceNumber
 * @return {Promise} resolves with array of formats
 */
const getLicenceFormats = async (licenceNumber) => {
  const splitDate = await getSplitDate(licenceNumber);

  console.log(splitDate);

  const formats = await getFormats(licenceNumber);

  // Load format data
  for (let format of formats) {
    format.purposes = await getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await getFormatPoints(format.ID, format.FGAC_REGION_CODE);
    format.cycles = getFormatCycles(format, splitDate);
  }
  return formats;
};

/**
 * @param {String} licenceNumber - the abstraction licence number
 */
const buildReturnsPacket = async (licenceNumber) => {
  const formats = await getLicenceFormats(licenceNumber);

  const returnsData = {
    returns: []
  };

  for (let format of formats) {
    for (let cycle of format.cycles) {
      const { startDate, endDate, isCurrent } = cycle;

      // Get all form logs relating to this cycle
      const cycleLogs = await getLogsForPeriod(format.ID, format.FGAC_REGION_CODE, startDate, endDate);

      // Only create return cycles for formats with logs to allow NALD prepop to
      // drive online returns
      if (cycleLogs.length === 0) {
        continue;
      }

      const returnId = getReturnId(licenceNumber, format, startDate, endDate);
      const receivedDate = mapReceivedDate(cycleLogs);
      const status = getStatus(receivedDate);

      // Create new return row
      const returnRow = {
        return_id: returnId,
        regime: 'water',
        licence_type: 'abstraction',
        licence_ref: licenceNumber,
        start_date: startDate,
        end_date: endDate,
        due_date: getDueDate(endDate),
        returns_frequency: mapPeriod(format.ARTC_REC_FREQ_CODE),
        status,
        source: 'NALD',
        metadata: JSON.stringify({
          ...formatReturnMetadata(format),
          isCurrent
        }),
        received_date: receivedDate,
        return_requirement: format.ID
      };

      returnsData.returns.push(returnRow);
    }
  }

  return returnsData;
};

module.exports = {
  buildReturnsPacket
};
