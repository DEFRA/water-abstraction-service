'use strict';
const { bookshelf } = require('../../../lib/connectors/bookshelf');

const deleteChargeElementsQuery = `
    delete from
    water.charge_elements
    where is_test=true;
    `;

const deleteChargeElements = async () => bookshelf.knex.raw(deleteChargeElementsQuery);

exports.delete = deleteChargeElements;
