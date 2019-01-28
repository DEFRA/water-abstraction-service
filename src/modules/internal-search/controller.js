const { parseQuery } = require('./lib/query-parser');
const { searchUsers } = require('./lib/search-users');
const { searchDocuments } = require('./lib/search-documents');
const { searchReturns } = require('./lib/search-returns');
const { buildResponse } = require('./lib/build-response');

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
