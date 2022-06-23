const { bookshelf } = require('../../../src/lib/connectors/bookshelf')

/**
 * Delete regions specified
 * @param {Array} ids
 * @return {Promise}
 */
const tearDown = () => {
  return bookshelf.knex('water.regions')
    .where('is_test', true)
    .del()
}

exports.tearDown = tearDown
