const moment = require('moment');

exports.getFinancialDateRange = (dateOfReference) => {
  const startDate = moment(dateOfReference);
  startDate.set('month', 3); // April
  startDate.set('date', 1);

  const endDate = moment(dateOfReference);
  endDate.set('month', 2); // March
  endDate.set('date', 31);

  if (moment(dateOfReference).month() <= 2) {
    startDate.subtract(1, 'year');
  } else {
    endDate.add(1, 'year');
  }

  return { startDate, endDate };
};
