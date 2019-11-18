const moment = require('moment');
const { range } = require('lodash');

const batchTypes = {
  supplementary: 'supplementary',
  annual: 'annual',
  twoPartTariff: 'two_part_tariff'
};

const batchIsOfType = type => batch => batch.batch_type === type;

/**
 * Tests if the batch is supplementary
 *
 * @param {Object} batch The batch record from the database
 */
const isSupplementaryBatch = batchIsOfType(batchTypes.supplementary);

/**
 * Tests if the batch is annual
 *
 * @param {Object} batch The batch record from the database
 */
const isAnnualBatch = batchIsOfType(batchTypes.annual);

const getFinancialYear = year => ({
  start: moment(`${year}-04-01`, 'YYYY-MM-DD'),
  end: moment(`${year + 1}-03-31`, 'YYYY-MM-DD')
});

/**
 * Given a batch containing a start and end financial year, this returns
 * an array of objects with the start and end dates of each financial year
 * in the range.
 * @param {Object} batch The database row for a batch
 */
const getFinancialYears = batch => {
  const { start_financial_year: start, end_financial_year: end } = batch;

  return range(start, end + 1).reduce((years, year) => {
    return [...years, getFinancialYear(year)];
  }, []);
};

/**
 * Tests if the batch is two part tariff
 *
 * @param {Object} batch The batch record from the database
 */
const isTwoPartTariffBatch = batchIsOfType(batchTypes.twoPartTariff);

exports.batchTypes = batchTypes;
exports.isSupplementaryBatch = isSupplementaryBatch;
exports.isAnnualBatch = isAnnualBatch;
exports.isTwoPartTariffBatch = isTwoPartTariffBatch;
exports.getFinancialYears = getFinancialYears;

exports.jobStatus = {
  start: 'batch:start',
  complete: 'batch:complete',
  findingTransactions: 'batch:finding-transactions'
};

exports.batchStatus = {
  processing: 'processing',
  complete: 'complete',
  error: 'error'
};
