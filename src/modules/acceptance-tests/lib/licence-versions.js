'use strict';
const { bookshelf } = require('../../../lib/connectors/bookshelf');

const deleteLicenceVersionsQuery = `
    delete from
    water.licence_versions
    where is_test=true;
    `;

const deleteLicenceVersions = async () => bookshelf.knex.raw(deleteLicenceVersionsQuery);

exports.delete = deleteLicenceVersions;
