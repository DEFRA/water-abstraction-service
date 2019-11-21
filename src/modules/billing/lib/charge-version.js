const moment = require('moment');

const isValidForFinancialYear = (chargeVersion, financialYear) => {
  const chargeVersionStart = moment(chargeVersion.start_date);
  const chargeVersionEnd = chargeVersion.end_date
    ? moment(chargeVersion.end_date)
    : moment().add(100, 'years');

  return chargeVersionStart.isSameOrBefore(financialYear.end) &&
    chargeVersionEnd.isSameOrAfter(financialYear.start);
};

exports.isValidForFinancialYear = isValidForFinancialYear;
