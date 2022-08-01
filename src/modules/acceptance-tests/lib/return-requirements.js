const { bookshelf } = require('../../../lib/connectors/bookshelf')
const queries = require('./queries/return-requirements')

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteReturnRequirementPurposes)
  await bookshelf.knex.raw(queries.deleteReturnRequirements)
  await bookshelf.knex.raw(queries.deleteReturnVersions)
}

exports.tearDown = tearDown
