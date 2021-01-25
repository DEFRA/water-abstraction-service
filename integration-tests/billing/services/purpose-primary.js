'use strict';
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const tearDown = () => bookshelf.knex.raw('delete from water.purposes_primary');

exports.tearDown = tearDown;
