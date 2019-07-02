const moment = require('moment');
const { first } = require('lodash');

const isValidDate = value => moment(value, 'DD/MM/YYYY').isValid();

const mapDate = value => moment(value, 'DD/MM/YYYY').format('YYYY-MM-DD');

/**
 * End date is the minimum of expiry date, revoked date and lapsed date
 * @param {Object} data - licence data
 * @return {String} date YYYY-MM-DD or null
 */
const getEndDate = (data = {}) => {
  const dates = [
    data.EXPIRY_DATE,
    data.REV_DATE,
    data.LAPSED_DATE
  ];
  const sortedAndFiltered = dates
    .filter(isValidDate)
    .map(mapDate)
    .sort();

  return first(sortedAndFiltered);
};

exports.getEndDate = getEndDate;
