'use strict';
const { bookshelf } = require('../../../lib/connectors/bookshelf');

const deleteChargeVersionsQuery = `
    delete from
    water.charge_versions
    where is_test=true;
    `;

const deleteChargeVersions = async () => bookshelf.knex.raw(deleteChargeVersionsQuery);

exports.delete = deleteChargeVersions;
