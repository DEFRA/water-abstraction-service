const moment = require('moment');
const { mapValues } = require('lodash');
const { dateToIsoString, returnsDateToIso } = require('./lib/date-helpers');

const { formatAbstractionPoint } = require('../../lib/licence-transformer/nald-helpers');

const {
  getFormats,
  getFormatPurposes,
  getFormatPoints,
  getLogs,
  getLines
} = require('./lib/nald-returns-queries.js');

/**
 * Converts 'null' strings to real null in supplied object
 * @param {Object} - plain object
 * @return {Object} with 'null' values converted to 'null'
 */
const convertNullStrings = (obj) => {
  return mapValues(obj, val => val === 'null' ? null : val);
};

const mapFrequency = (str) => {
  const frequencies = {
    'D': 'daily',
    'W': 'weekly',
    'M': 'monthly',
    'A': 'annual'
  };
  return frequencies[str];
};

const mapPeriod = (str) => {
  const periods = {
    'D': 'day',
    'W': 'week',
    'M': 'month',
    'A': 'year'
  };
  return periods[str];
};

/**
 * Calculates start of period based on start/end date and period
 * @param {String} startDate - the returns start date YYYYMMDD
 * @param {String} endDate - the line end date YYYYMMDD
 * @param {String} period - the returns period - A/M/W/D
 * @return {String} a date in format YYYY-MM-DD
 */
const getStartDate = (startDate, endDate, period) => {
  const d = moment(endDate, 'YYYYMMDD');
  let o;

  if (period === 'A') {
    o = moment(startDate, 'YYYYMMDD');
  }
  if (period === 'M') {
    o = d.startOf('month');
  }
  if (period === 'W') {
    o = d.startOf('week');
  }
  if (period === 'D') {
    o = d;
  }

  return o.format('YYYY-MM-DD');
};

/**
 * Converts units in NALD to recognised SI unit
 * @param {String} unit
 * @return {String} SI unit
 */
const mapUnit = (u) => {
  const units = {
    M: 'm³',
    l: 'L'
  };
  return units[u];
};

const buildReturnsPacket = async (licenceNumber) => {
  const formats = await getFormats(licenceNumber);

  for (let format of formats) {
    let logs = await getLogs(format.ID, format.FGAC_REGION_CODE);
    for (let log of logs) {
      log.lines = await getLines(format.ID, format.FGAC_REGION_CODE, log.DATE_FROM);
    }

    format.purposes = await getFormatPurposes(format.ID, format.FGAC_REGION_CODE);
    format.points = await getFormatPoints(format.ID, format.FGAC_REGION_CODE);
    format.logs = logs;
  }

  const returnsData = {
    returns: [],
    versions: [],
    lines: []
  };

  for (let format of formats) {
    for (let log of format.logs) {
      const startDate = dateToIsoString(log.DATE_FROM);
      const endDate = dateToIsoString(log.DATE_TO);
      const logId = `${startDate}:${endDate}`;
      const returnId = `v1:${format.FGAC_REGION_CODE}:${licenceNumber}:${format.ID}:${logId}`;

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
          version: 1,
          description: format.SITE_DESCR,
          purposes: format.purposes.map(purpose => ({
            primary: {
              code: purpose.APUR_APPR_CODE,
              description: purpose.primary_purpose
            },
            secondary: {
              code: purpose.APUR_APSE_CODE,
              description: purpose.secondary_purpose
            },
            tertiary: {
              code: purpose.APUR_APUS_CODE,
              description: purpose.tertiary_purpose
            }
          })),
          points: format.points.map(point => formatAbstractionPoint(convertNullStrings(point))),
          nald: {
            regionCode: parseInt(format.FGAC_REGION_CODE),
            formatId: parseInt(format.ID),
            dateFrom: dateToIsoString(log.DATE_FROM),
            dateTo: dateToIsoString(log.DATE_TO),
            dateReceived: dateToIsoString(log.RECD_DATE),
            periodStartDay: format.ABS_PERIOD_ST_DAY,
            periodStartMonth: format.ABS_PERIOD_ST_MONTH,
            periodEndDay: format.ABS_PERIOD_END_DAY,
            periodEndMonth: format.ABS_PERIOD_END_MONTH,
            underQuery: log.UNDER_QUERY_FLAG === 'Y'
          }
        })
      };

      const versionRow = {
        version_id: returnId,
        return_id: returnId,
        version_number: 1,
        user_id: 'water-abstraction-service',
        user_type: 'agency',
        metadata: '{}',
        nil_return: log.lines.length === 0
      };

      returnsData.returns.push(returnRow);
      returnsData.versions.push(versionRow);

      for (let line of log.lines) {
        const endDate = returnsDateToIso(line.RET_DATE);
        const lineRow = {
          line_id: `${returnId}:${line.RET_DATE}`,
          version_id: returnId,
          substance: 'water',
          quantity: line.RET_QTY === '' ? null : parseFloat(line.RET_QTY),
          unit: mapUnit(line.UNIT_RET_FLAG) || '?',
          start_date: getStartDate(line.ARFL_DATE_FROM, line.RET_DATE, format.ARTC_REC_FREQ_CODE),
          end_date: endDate,
          time_period: mapPeriod(format.ARTC_REC_FREQ_CODE),
          metadata: '{}'
        };

        returnsData.lines.push(lineRow);
      }
    }
  }

  return returnsData;
};

module.exports = {
  buildReturnsPacket
};
