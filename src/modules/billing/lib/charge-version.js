const moment = require('moment');

const isValidForFinancialYear = (chargeVersion, financialYear) => {
  const chargeVersionStart = moment(chargeVersion.startDate);
  const chargeVersionEnd = chargeVersion.endDate
    ? moment(chargeVersion.endDate)
    : moment().add(100, 'years');

  return chargeVersionStart.isSameOrBefore(financialYear.end) &&
    chargeVersionEnd.isSameOrAfter(financialYear.start);
};

exports.isValidForFinancialYear = isValidForFinancialYear;
