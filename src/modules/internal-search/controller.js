const { parseQuery } = require('./lib/query-parser');
const { searchUsers } = require('./lib/search-users');
const { searchDocuments } = require('./lib/search-documents');
const { searchReturns } = require('./lib/search-returns');

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

  // Single return
  if (isReturnId) {
    const returns = await searchReturns(query);
    if (returns) {
      return { returns };
    }
  }
  // User search
  if (isUser) {
    const { data: users, pagination } = await searchUsers(query, page);
    return users.length
      ? { users, pagination }
      : {};
  } else {
    // Search returns
    const response = {};
    if (isNumeric) {
      const returns = await searchReturns(query);
      if (returns.length) {
        response.returns = returns;
      }
    }
    // Search CRM documents
    const { data: documents, pagination } = await searchDocuments(query, page);
    if (documents.length) {
      Object.assign(response, { documents, pagination });
    }
    return response;
  }
};

module.exports = {
  getInternalSearch
};
