'use strict';
const { bookshelf } = require('../../../lib/connectors/bookshelf');
const { ACCEPTANCE_TEST_SOURCE } = require('./constants');

const deleteBatchesQuery = `
    delete from
    water.billing_batches
    where metadata->>'source' = '${ACCEPTANCE_TEST_SOURCE}';
    `;

const deleteBatches = async () => bookshelf.knex.raw(deleteBatchesQuery);

exports.delete = deleteBatches;
