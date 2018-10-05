/**
 * Given a list of valid return IDs for a particular licence, finds any
 * others and marks them for deletion by setting a metadata flag
 *
 */
const { returns } = require('../../../lib/connectors/returns');
const { findAllPages } = require('../../../lib/api-client-helpers');

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

/**
 * Marks returns that weren't located as part of the import as deleted
 * @param {String} licenceNumber
 * @param {Array} returnIds - a list of valid return IDs for the supplied licence number
 * @return {Promise} resolves when returns updated
 */
const markInvalidCycles = async (licenceNumber, returnIds) => {
  const filter = getFilter(licenceNumber, returnIds);
  const rows = await findAllPages(returns, filter, {}, ['return_id', 'metadata']);
  const tasks = rows.map(row => {
    console.log(`Deleting invalid return ${row.return_id}`);
    return returns.delete(row.return_id);
  });

  return Promise.all(tasks);
};

module.exports = {
  markInvalidCycles
};
