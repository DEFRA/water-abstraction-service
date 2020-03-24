const { getFinancialYearDate } = require('@envage/water-abstraction-helpers').charging;
const raw = require('./lib/raw');
const queries = require('./queries/billing-batch-charge-versions');

const getParams = params => ({
  ...params,
  fromDate: getFinancialYearDate(1, 4, params.fromFinancialYearEnding)
});

/**
  * Writes into billing_batch_charge_versions a list of charge versions for
  * the given region for supplementary billing.
  * @param {String} regionId - GUID from water.regions.region_id
  * @param {String} billingBatchId - GUID from water.billing_batches.billing_batch_id
  * @param {Number} toFinancialYearEnding - the year in which the financial year being processed ends
  * @return {Promise<Array>} charge versions, properties are camel-cased
  */
const createSupplementary = params =>
  raw.multiRow(queries.createSupplementary, getParams(params));

/**
  * Writes into billing_batch_charge_versions a list of charge versions for
  * the given region for annual billing.
  * @param {String} regionId - GUID from water.regions.region_id
  * @param {String} billingBatchId - GUID from water.billing_batches.billing_batch_id
  * @param {Number} toFinancialYearEnding - the year in which the financial year being processed ends
  * @return {Promise<Array>} charge versions, properties are camel-cased
  */
const createAnnual = params =>
  raw.multiRow(queries.createAnnual, getParams(params));

/**
  * Writes into billing_batch_charge_versions a list of charge versions for
  * the given region for two-part tariff billing.
  * @param {String} regionId - GUID from water.regions.region_id
  * @param {String} billingBatchId - GUID from water.billing_batches.billing_batch_id
  * @param {Number} toFinancialYearEnding - the year in which the financial year being processed ends
  * @param {String} season - summer|winter - the season of the two-part billing batch
  * @return {Promise<Array>} charge versions, properties are camel-cased
  */
const createTwoPartTariff = params =>
  raw.multiRow(queries.createTwoPartTariff, getParams(params));

exports.createAnnual = createAnnual;
exports.createSupplementary = createSupplementary;
exports.createTwoPartTariff = createTwoPartTariff;
