'use strict';

const { pool } = require('../../../lib/connectors/db');

const deleteLicenceVersions = () => {
  return pool.query(`
    delete from
    water.licence_versions
    where is_test=true;
    `);
};

exports.delete = deleteLicenceVersions;
