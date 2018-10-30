/**
 * Creates or updates return cycle via returns API based on the return end date
 */
const { pick } = require('lodash');
const moment = require('moment');
const returnsApi = require('../../../lib/connectors/returns');

const { returns } = returnsApi;

/**
 * Checks whether return exists
 * @param {String} returnId - the return ID in the returns service
 * @return {Promise} resolves with boolean
 */
const returnExists = async (returnId) => {
  const { data } = await returns.findOne(returnId);
  if (data) {
    return true;
  }
  return false;
};

/**
 * Gets update data from row
 * @param {Object} row
 * @return {Object} row - with only fields that we wish to update set
 */
const getUpdateRow = (row) => {
  const { end_date: endDate } = row;
  if (moment(endDate).isBefore('2018-10-31')) {
    return pick(row, ['status', 'metadata', 'received_date']);
  } else {
    return pick(row, ['metadata']);
  }
};

/**
 * Creates or updates return depending on whether start_date
 * @TODO can check whether row exists by doing update and looking for NotFoundError
 * @param {Object} row
 * @return {Promise} resolves when row is created/updated
 */
const createOrUpdateReturn = async (row) => {
  const { return_id: returnId } = row;

  const exists = await returnExists(returnId);

  // Conditional update
  if (exists) {
    return returns.updateOne(returnId, getUpdateRow(row));
  } else {
    // Insert
    return returns.create(row);
  }
};

/**
 * Persists list of returns to API
 * @param {Array} returns
 * @return {Promise} resolves when all processed
 */
const persistReturns = async (returns) => {
  for (let ret of returns) {
    await createOrUpdateReturn(ret);
  }
};

module.exports = {
  createOrUpdateReturn,
  getUpdateRow,
  returnExists,
  persistReturns
};
