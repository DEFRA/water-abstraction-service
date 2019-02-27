const moment = require('moment');

/**
 * Accepts a date formatted DD/MM/YYYY and formats to YYYY-MM-DD
 * @param  {String} date - formatted DD/MM/YYYY
 * @return {String}      - formatted YYYY-MM-DD
 */
const ukDateToISO = date => {
  const m = moment(date, 'DD/MM/YYYY');
  return m.isValid()
    ? m.format('YYYY-MM-DD')
    : null;
};

exports.ukDateToISO = ukDateToISO;
