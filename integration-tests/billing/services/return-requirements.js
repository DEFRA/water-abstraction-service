const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const queries = require('./queries/return-requirements');

const tearDownReturnPurposes = async () => {
  return bookshelf.knex.raw(queries.deleteReturnRequirementPurposes);
};
const tearDownReturnRequirements = async () => {
  return bookshelf.knex.raw(queries.deleteReturnRequirements);
};
const tearDownReturnVersions = async () => {
  return bookshelf.knex.raw(queries.deleteReturnVersions);
};

exports.tearDownReturnPurposes = tearDownReturnPurposes;
exports.tearDownReturnRequirements = tearDownReturnRequirements;
exports.tearDownReturnVersions = tearDownReturnVersions;
