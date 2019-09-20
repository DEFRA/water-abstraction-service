const moment = require('moment');
const queries = require('./lib/nald-returns-queries.js');

const helpers = require('./lib/transform-returns-helpers.js');

const dueDate = require('./lib/due-date');

const { getReturnId } = require('../../lib/returns');

/**
 * Loads licence formats from DB
 * @param {String} licenceNumber
 * @return {Promise} resolves with array of formats
 */
const getLicenceFormats = async (licenceNumber) => {
  const splitDate = await queries.getSplitDate(licenceNumber);

  const formats = await queries.getFormats(licenceNumber);

  // Load format data
  for (let format of formats) {
    format.purposes = await queries.getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await queries.getFormatPoints(format.ID, format.FGAC_REGION_CODE);
    format.cycles = helpers.getFormatCycles(format, splitDate);
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
      const cycleLogs = await queries.getLogsForPeriod(format.ID, format.FGAC_REGION_CODE, startDate, endDate);

      // Only create return cycles for formats with logs to allow NALD prepop to
      // drive online returns
      if (cycleLogs.length === 0) {
        continue;
      }

      const returnId = getReturnId(format.FGAC_REGION_CODE, licenceNumber, format.ID, startDate, endDate);
      const receivedDate = helpers.mapReceivedDate(cycleLogs);
      const status = helpers.getStatus(receivedDate);

      // Create new return row
      const returnRow = {
        return_id: returnId,
        regime: 'water',
        licence_type: 'abstraction',
        licence_ref: licenceNumber,
        start_date: startDate,
        end_date: endDate,
        due_date: await dueDate.getDueDate(endDate, format),
        returns_frequency: helpers.mapPeriod(format.ARTC_REC_FREQ_CODE),
        status,
        source: 'NALD',
        metadata: JSON.stringify({
          ...helpers.formatReturnMetadata(format),
          isCurrent,
          isFinal: moment(endDate).isSame(helpers.getFormatEndDate(format), 'day')
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
  buildReturnsPacket,
  getLicenceFormats
};
