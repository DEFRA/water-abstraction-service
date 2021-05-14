const { searchUsers } = require('./search-users');
const { searchDocuments } = require('./search-documents');
const { searchReturns } = require('./search-returns');
const { searchGaugingStations } = require('./search-gauging-stations');

module.exports = {
  searchUsers,
  searchDocuments,
  searchReturns,
  searchGaugingStations
};
