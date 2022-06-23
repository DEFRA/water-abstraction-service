const { bookshelf } = require('../../../src/lib/connectors/bookshelf')

const tearDown = () => {
  return bookshelf.knex('water.licences')
    .where('is_test', true)
    .del()
}

exports.tearDown = tearDown
