const ExtendableError = require('es6-error');

class APIError extends ExtendableError {
  constructor (error) {
    super(`API error: ${JSON.stringify(error)}`);
  }
};

/**
 * Accepts error response from hapi-pg-rest-api and throws if truthy
 * @param  {Object|null} error [description]
 */
const throwIfError = (error) => {
  if (error) {
    throw new APIError(error);
  }
};

/**
 * Finds all pages of data for a particular filter request and returns as a
 * flat array
 *
 * @param {Object} apiClient - the HAPI REST API client instance
 * @param {Object} [filter] - mongo-sql filter criteria
 * @param {Object} [sort] - sort fields/direction
 * @param {Array} [columns] - columns to return
 * @return {Promise} resolves with flat array of data
 */
const findAllPages = async (apiClient, filter = {}, sort = {}, columns = []) => {
  // Find first page
  const { error, pagination: { pageCount, perPage } } = await apiClient.findMany(filter, sort, null, []);

  throwIfError(error);

  const rows = [];

  for (let page = 1; page <= pageCount; page++) {
    const pagination = {
      page,
      perPage
    };
    const { error, data } = await apiClient.findMany(filter, sort, pagination, columns);

    throwIfError(error);

    rows.push(...data);
  }

  return rows;
};

module.exports = {
  findAllPages,
  throwIfError
};
