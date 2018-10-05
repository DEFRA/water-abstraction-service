/**
 * Given a list of valid return IDs for a particular licence, finds any
 * others and marks them for deletion by setting a metadata flag
 *
 */
const Boom = require('boom');
const { returns } = require('../../../lib/connectors/returns');
const { findAllPages } = require('../../../lib/api-client-helpers');

/**
 * Loads the metadata for a given return, merges with supplied metadata,
 * and saves the return
 * @param {String} returnId
 * @param {Object} metadata
 * @return {Promise} resolves when return updated
 */
const mergeReturnMetadada = async (returnId, metadata = {}) => {
  const filter = { return_id: returnId };

  // Find return
  const { error, data: [ret] } = await returns.findMany(filter, {}, null, ['metadata']);
  if (error) {
    throw Boom.badImplementation(`Error retrieving return ${returnId}`, error);
  }
  if (!ret) {
    throw Boom.notFound(`Return ${returnId} not found`);
  }

  const newMetadata = {
    ...ret.metadata,
    ...metadata
  };

  return returns.updateMany(filter, { metadata: JSON.stringify(newMetadata) });
};

/**
 * Gets the filter which will be used to find returns whose IDs
 * don't match any of the current return IDs
 * @param {String} licenceNumber
 * @param {Array} returnIds
 * @return {Object}
 */
const getFilter = (licenceNumber, returnIds) => {
  return {
    return_id: {
      $nin: returnIds
    },
    regime: 'water',
    licence_type: 'abstraction',
    licence_ref: licenceNumber,
    source: 'NALD'
  };
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
    console.log(`Marking ${row.return_id} for deletion`);
    return mergeReturnMetadada(row.return_id, { deleted: true });
  });

  return Promise.all(tasks);
};

module.exports = {
  markInvalidCycles
};
