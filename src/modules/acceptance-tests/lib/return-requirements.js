const { bookshelf } = require('../../../lib/connectors/bookshelf');
const queries = require('./queries/return-requirements');

const tearDownData = query => async () => bookshelf.knex.raw(query);

const tearDown = async () => {
  await tearDownData(queries.deleteReturnRequirementPurposes);
  await tearDownData(queries.deleteReturnRequirements);
  await tearDownData(queries.deleteReturnVersions);
};

exports.tearDown = tearDown;
