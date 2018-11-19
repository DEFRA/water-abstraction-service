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

module.exports = {
  getWeek
};
