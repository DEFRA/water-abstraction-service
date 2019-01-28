const { set } = require('lodash');
const { parseQuery } = require('./lib/query-parser');
const { searchUsers } = require('./lib/search-users');
const { searchDocuments } = require('./lib/search-documents');
const { searchReturns } = require('./lib/search-returns');

/**
 * Build response object
 * Only adds key to response if there is >0 data items for that key
 * @param  {Object} response - the API response being built
 * @param  {String} key      - the key for data in the response object
 * @param  {Object|Array} data - the data to add
 */
const buildResponse = (response, key, data) => {
  if ('pagination' in data) {
    if (data.data.length) {
      set(response, key, data.data);
      set(response, 'pagination', data.pagination);
    }
  } else if (data.length) {
    set(response, key, data);
  }
};

/**
 * Provides an API for internal search.
 * Internal searches for:
 * - Licences
 * - Returns
 * - Users
 */
const getInternalSearch = async (request, h) => {
  const { query, page } = request.query;

  const { isUser, isNumeric, isReturnId } = parseQuery(query);

  const response = {};

  // Single return
  if (isReturnId) {
    const data = await searchReturns(query);
    buildResponse(response, 'returns', data);
  } else if (isUser) {
    // User search
    const data = await searchUsers(query, page);
    buildResponse(response, 'users', data);
  } else {
    // Search returns
    if (isNumeric) {
      const data = await searchReturns(query);
      buildResponse(response, 'returns', data);
    }
    // Search CRM documents
    const data = await searchDocuments(query, page);
    buildResponse(response, 'documents', data);
  }

  return response;
};

module.exports = {
  getInternalSearch
};
