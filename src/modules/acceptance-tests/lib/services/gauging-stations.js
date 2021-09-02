
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');
const queries = require('../queries/gauging-stations');

const tearDown = () => bookshelf.knex.raw(queries.deleteLinkages);

exports.tearDown = tearDown;
