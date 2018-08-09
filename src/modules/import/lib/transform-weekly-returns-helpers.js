const moment = require('moment');
const { returnsDateToIso } = require('../lib/date-helpers');
const { mapUnit, mapQuantity, mapUsability, mapPeriod, formatLineMetadata } = require('./transform-returns-helpers');

/**
 * Reduces the units used for values used within a week
 * to a single value.  Throws an error if > 1
 * @param {Array} values - a list of units used for a week's daily returns
 * @return {String} unit (m3 or gal)
 */
const reduceWeekUnits = (values) => {
  return values.reduce((acc, value) => {
    if (acc === null) {
      return mapUnit(value);
    }
    if (mapUnit(value) !== acc) {
      throw new Error('Unit mismatch within week data');
    }
    return acc;
  }, null);
};

/**
 * Reduce week quantities to a single value
 * @param {Array} values - a list of quantities recorded for a week's daily returns
 * @return {Number} - total quantity
 */
const reduceWeekQuantities = (values) => {
  return values.reduce((acc, value) => {
    const qty = mapQuantity(value);
    if (acc === null) {
      return qty;
    }
    return acc + qty;
  }, null);
};

/**
 * Reduce week usability to a single value
 * @param {Array} values - a list of usability flags for a week's returns data
 * @return {String} a single usability value
 */
const reduceWeekUsability = (values) => {
  return values.reduce((acc, value) => {
    if (acc === null) {
      return mapUsability(value);
    }
    if (mapUsability(value) !== acc) {
      throw new Error('Usability mismatch within week data');
    }
    return acc;
  }, null);
};

/**
 * Gets the date on which return data was entered for a particular week's data.
 * If return value > 0 encountered on more than 1 day, an error is thrown
 * @param {Array} lines
 * @return {String|null} return date
 */
const reduceWeekReturnDate = (lines) => {
  return lines.reduce((acc, line) => {
    const { RET_QTY: quantity, RET_DATE: returnDate } = line;
    const qty = mapQuantity(quantity);
    if (qty > 0 && acc !== null) {
      throw new Error('Data encountered on more than one day of a week');
    }
    if (qty !== null) {
      return returnsDateToIso(returnDate);
    }
    return acc;
  }, null);
};

const convertWeekData = (returnId, lines, versionStartDate) => {
  // Reduce daily line data into weeks
  const weekData = lines.reduce((acc, line) => {
    const endDate = returnsDateToIso(line.RET_DATE);

    // Create an ID for this week from the week number and week year
    const id = moment(endDate).format('gggg-w');

    if (!(id in acc)) {
      acc[id] = [];
    }
    acc[id].push(line);
    return acc;
  }, {});

  // Combine week data
  const weekLines = [];
  for (let id in weekData) {
    const lines = weekData[id];

    const [year, week] = id.split('-');

    const startDate = moment().weekYear(year).week(week).day(0).format('YYYY-MM-DD');
    const endDate = moment().weekYear(year).week(week).day(6).format('YYYY-MM-DD');

    const quantities = lines.map(row => row.RET_QTY);
    const units = lines.map(row => row.UNIT_RET_FLAG);
    const usabilities = lines.map(row => row.RET_QTY_USABILITY);

    const lastLine = lines[lines.length - 1];
    const isCurrent = versionStartDate && moment(startDate).isSameOrAfter(versionStartDate);

    const dailyLines = lines.map(row => ({
      start_date: returnsDateToIso(row.RET_DATE),
      quantity: mapQuantity(row.RET_QTY),
      unit: mapUnit(row.UNIT_RET_FLAG),
      reading_type: mapUsability(row.RET_QTY_USABILITY)
    }));

    const metadata = {
      ...formatLineMetadata(lastLine),
      isCurrent,
      dailyLines
    };

    weekLines.push({
      line_id: `${returnId}:${lastLine.ARFL_DATE_FROM}:${startDate}:${endDate}`,
      version_id: returnId,
      substance: 'water',
      quantity: reduceWeekQuantities(quantities),
      unit: reduceWeekUnits(units),
      start_date: startDate,
      end_date: endDate,
      time_period: mapPeriod('W'),
      metadata: JSON.stringify(metadata),
      reading_type: reduceWeekUsability(usabilities)
    });
  }

  return weekLines;
};

module.exports = {
  convertWeekData
};
