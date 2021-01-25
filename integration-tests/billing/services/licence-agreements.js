
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const tearDown = () =>
  bookshelf.knex('water.licence_agreements')
    .where('is_test', true)
    .del();

// exports.create = create;
exports.tearDown = tearDown;
