const { parseQuery } = require('./query-parser');
const { usersClient } = require('../../lib/connectors/idm');

const searchUsers = (query) => {
  const filter = {
    user_name: {
      $ilike: `%${query}%`
    }
  };
  return usersClient.findMany(filter);
};

const getResults = async (query) => {
  const flags = parseQuery(query);
};

module.exports = {
  getResults
};
