const moment = require('moment');

const withNaldLocale = date => moment(date).locale('en');
const getFirstDayOfWeek = day => withNaldLocale(day).startOf('week');
const getLastDayOfWeek = day => withNaldLocale(day).endOf('week');

/**
 * Gets the start and end days of a week relative to the passed day
 * in NALD terms, where the week is deemed to start on a sunday, and
 * end on the saturday.
 */
const getWeek = day => {
  return {
    start: getFirstDayOfWeek(day),
    end: getLastDayOfWeek(day)
  };
};

/**
 * Accepts a date formatted DD/MM/YYYY and formats to YYYY-MM-DD
 * @param  {String} date - formatted DD/MM/YYYY
 * @return {String}      - formatted YYYY-MM-DD
 */
const ukDateToISO = (date) => {
  const m = moment(date, 'DD/MM/YYYY');
  if (m.isValid()) {
    return m.format('YYYY-MM-DD');
  }
  return null;
};

module.exports = {
  getWeek,
  ukDateToISO
};
