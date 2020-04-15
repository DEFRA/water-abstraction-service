const { getFinancialYearDate } = require('@envage/water-abstraction-helpers').charging;
const returns = require('../../../../lib/connectors/returns');
const camelCaseKeys = require('../../../../lib/camel-case-keys');

/**
 * Determine return cycle details from information in batch
 *
 * @param {Batch} batch
 * @return {startDate} moment - start of return cycle
 * @return {endDate} moment - end of return cycle
 */
const getReturnCycleFromBatch = batch => {
  const { endYear: { yearEnding } } = batch;
  const returnCycleStartMonth = batch.isSummer ? 11 : 4;
  const yearStarting = batch.isSummer ? yearEnding - 1 : yearEnding;

  return {
    startDate: getFinancialYearDate(1, returnCycleStartMonth, yearStarting),
    endDate: getFinancialYearDate(31, returnCycleStartMonth - 1, yearEnding)
  };
};

const getReturnsForMatching = async (licence, batch) => {
  const { startDate, endDate } = getReturnCycleFromBatch(batch);
  const returnsForLicence = await returns.getReturnsForLicence(licence.licenceNumber, startDate, endDate);

  for (const ret of returnsForLicence) {
    const lines = await returns.getLinesForReturn(ret);
    ret.lines = camelCaseKeys(lines);
  }
  return returnsForLicence;
};

exports.getReturnsForMatching = getReturnsForMatching;
