const { set } = require('lodash');
const returns = require('../../../../lib/connectors/returns');
const { getFinancialYearDate } = require('@envage/water-abstraction-helpers').charging;
const matchReturnsToChargeElements = require('./two-part-tariff-matching');

/**
 * Determine return cycle details from information in batch
 *
 * @param {Batch} batch
 * @return {startDate} moment - start of return cycle
 * @return {endDate} moment - end of return cycle
 */
const getReturnCycleFromBatch = batch => {
  const { endYear: { yearEnding } } = batch;
  const returnCycleEndYear = batch.isSummer() ? yearEnding - 1 : yearEnding;
  const returnCycleStartMonth = batch.isSummer() ? 11 : 4;
  return {
    startDate: getFinancialYearDate(1, returnCycleStartMonth, returnCycleEndYear),
    endDate: getFinancialYearDate(31, returnCycleStartMonth - 1, returnCycleEndYear)
  };
};

/**
 * Incorporates output of returns algorithm with charge element data
 *
 * @param {Array} matchingResults Output from returns matching algorithm
 * @param {ChargeVersion} chargeVersion
 * @return {chargeVersion} including returns matching results
 */
const mapMatchingResultsToElements = (matchingResults, chargeVersion) => {
  const { error: overallError, data } = matchingResults;
  const updatedChargeElements = data.map(result => {
    const { error, data: { chargeElementId, actualReturnQuantity, proRataAuthorisedQuantity } } = result;
    const [chargeElement] = chargeVersion.chargeElements.filter(ele => ele.chargeElementId === chargeElementId);
    return {
      ...chargeElement,
      actualReturnQuantity,
      ...proRataAuthorisedQuantity && proRataAuthorisedQuantity,
      matchingError: overallError || error
    };
  });
  set(chargeVersion, 'chargeElements', updatedChargeElements);
  return chargeVersion;
};

/**
 * Process returns matching for given charge version
 *
 * @param {chargeVersion} chargeVersion
 * @param {Batch} batch
 * @return {chargeVersion} including returns matching results
 */
const processReturnsMatching = async (chargeVersion, batch) => {
  const { startDate, endDate } = getReturnCycleFromBatch(batch);

  const returnsForLicence = await returns.getReturnsForLicence(chargeVersion.licenceRef, startDate, endDate);
  const matchingResults = matchReturnsToChargeElements(chargeVersion, returnsForLicence);
  return mapMatchingResultsToElements(matchingResults, chargeVersion);
};

const processBatch = async batch => {
  console.log('-----------BATCH------------');
  console.log(batch);
};

exports.processBatch = processBatch;
