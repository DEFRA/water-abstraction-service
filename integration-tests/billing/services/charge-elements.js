'use strict';
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const tearDown = () =>
  bookshelf.knex('water.charge_elements')
    .where('is_test', true)
    .del();

exports.tearDown = tearDown;
