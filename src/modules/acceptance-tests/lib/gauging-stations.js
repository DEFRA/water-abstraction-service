const { bookshelf } = require('../../../lib/connectors/bookshelf')
const queries = require('./queries/gauging-stations')

const tearDown = () => bookshelf.knex.raw(queries.deleteLinks)

exports.tearDown = tearDown
