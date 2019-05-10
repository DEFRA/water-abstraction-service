/**
 * Given a list of valid return IDs for a particular licence, finds any
 * others and marks them for deletion by setting a metadata flag
 *
 */
const { returns } = require('../../../lib/connectors/returns');
const { chunk } = require('lodash');

/**
 * Gets the filter which will be used to find returns whose IDs
 * don't match any of the current return IDs
 * @param {String} licenceNumber
 * @param {Array} returnIds
 * @return {Object}
 */
const getFilter = (licenceNumber, returnIds) => {
  const filter = {
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: licenceNumber,
    source: 'NALD'
  };
  if (returnIds.length) {
    filter.return_id = {
      $nin: returnIds
    };
  }
  return filter;
};

const getReturnIds = (returns) => returns.map(row => row.return_id);

/**
 * Given a row of return data, and an async predicate,
 * extracts the return_ids and passes each through the predicate,
 * resolving when done
 * @param {Array} returns
 * @param {function} func
 * @return {Promise} resolves when complete
 */
const processReturnsAsync = (returns, func) => {
  const returnIds = getReturnIds(returns);
  const tasks = returnIds.map(func);
  return Promise.all(tasks);
};

const voidReturn = (returnId) => returns.updateOne(returnId, { status: 'void' });

/**
 * Marks returns that weren't located as part of the import as deleted
 * @param {String} licenceNumber
 * @param {Array} returnIds - a list of valid return IDs for the supplied licence number
 * @return {Promise} resolves when returns updated
 */
const voidInvalidCycles = async (licenceNumber, returnIds) => {
  // Only do 20 at a time to prevent making the URI too large by adding an
  // unlimited number of returns ids to the filter.
  const chunks = chunk(returnIds, 20);
  const promises = [];

  for (const chunk of chunks) {
    const filter = getFilter(licenceNumber, chunk);
    const rows = await returns.findAll(filter, {}, ['return_id', 'metadata']);
    promises.push(processReturnsAsync(rows, voidReturn));
  }
  return Promise.all(promises);
};

module.exports = {
  voidInvalidCycles,
  processReturnsAsync,
  getFilter
};
