
const { bookshelf } = require('../../../src/lib/connectors/bookshelf')
const queries = require('./queries/gauging-stations')

const tearDownCypressCreatedLinkages = () => bookshelf.knex.raw(queries.deleteLinkages)

exports.tearDownCypressCreatedLinkages = tearDownCypressCreatedLinkages
