const Boom = require('boom');
const {
  returns,
  versions,
  lines
} = require('../../lib/connectors/returns');

/**
 * Gets return row from returns API
 * @param {String} returnId
 * @return {Promise} resolves with row of returns data
 */
const fetchReturn = async (returnId) => {
  const filter = {
    return_id: returnId,
    regime: 'water',
    licence_type: 'abstraction'
  };
  const { data: [returnRow], error } = await returns.findMany(filter);
  if (error) {
    throw Boom.badImplementation(error);
  }
  if (!returnRow) {
    throw Boom.notFound(`Return ${returnId} not found`);
  }
  return returnRow;
};

/**
 * Gets most recent version, or the version with the specified number if present
 * @param {String} returnId
 * @param {Number} [versionNumber]
 * @return {Promise} resolves with version row if found
 */
const fetchVersion = async (returnId, versionNumber) => {
  const sort = {
    version_number: -1
  };
  const pagination = {
    perPage: 1
  };
  const filter = {
    return_id: returnId
  };
  if (versionNumber === undefined) {
    filter.version_number = versionNumber;
  }
  const { data: [versionRow], error } = await versions.findMany(filter, sort, pagination);
  if (error) {
    throw Boom.badImplementation(error);
  }
  if (!versionRow) {
    throw Boom.notFound(`Version for ${returnId} not found`);
  }
  return versionRow;
};

/**
 * Fetch line data from return
 * @param {String} returnId
 * @param {String} versionId
 * @return {Promise} resolves with line data
 */
const fetchLines = async (returnId, versionId) => {
  const sort = {
    start_date: +1
  };
  const filter = {
    return_id: returnId,
    version_id: versionId
  };
  const pagination = {
    perPage: 365
  };
  const { data, error } = await lines.findMany(filter, sort, pagination);
  if (error) {
    throw Boom.badImplementation(error);
  }
  return data;
};

module.exports = {
  fetchReturn,
  fetchVersion,
  fetchLines
};
