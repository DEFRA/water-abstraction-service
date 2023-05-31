const { bookshelf } = require('../../../lib/connectors/bookshelf')
const queries = require('./queries/licence-agremeents')

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteLicenceAgreements)
  await bookshelf.knex('water.licence_agreements')
    .where('is_test', true)
    .del()
}

exports.tearDown = tearDown
