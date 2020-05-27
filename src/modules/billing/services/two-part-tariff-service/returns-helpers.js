const { getFinancialYearDate } = require('@envage/water-abstraction-helpers').charging;
const returns = require('../../../../lib/connectors/returns');
const camelCaseKeys = require('../../../../lib/camel-case-keys');

/**
 * Determine start and end date of return cycle
 * using the financial year and isSummer flag
 * @param {Integer} financialYear
 * @param {Boolean} isSummer
 * @return {startDate} moment - start of return cycle
 * @return {endDate} moment - end of return cycle
 */
const getReturnCycle = (financialYear, isSummer) => {
  const returnCycleStartMonth = isSummer ? 11 : 4;
  const yearStarting = isSummer ? financialYear - 1 : financialYear;

  return {
    startDate: getFinancialYearDate(1, returnCycleStartMonth, yearStarting),
    endDate: getFinancialYearDate(31, returnCycleStartMonth - 1, financialYear)
  };
};

const getReturnsForMatching = async (licenceRef, financialYear, isSummer) => {
  const { startDate, endDate } = getReturnCycle(financialYear, isSummer);
  const returnsForLicence = await returns.getReturnsForLicence(licenceRef, startDate, endDate);

  for (const ret of returnsForLicence) {
    const lines = await returns.getLinesForReturn(ret);
    ret.lines = camelCaseKeys(lines);
  }
  return returnsForLicence;
};

exports.getReturnsForMatching = getReturnsForMatching;
