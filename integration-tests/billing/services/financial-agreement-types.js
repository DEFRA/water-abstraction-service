const { bookshelf } = require('../../../src/lib/connectors/bookshelf')

const tearDown = () =>
  bookshelf.knex('water.financial_agreement_types')
    .where('is_test', true)
    .del()

exports.tearDown = tearDown
