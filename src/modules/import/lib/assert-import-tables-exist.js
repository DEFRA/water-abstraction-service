'use strict';

const { NALDImportTablesError } = require('./errors');
const naldQueries = require('./nald-queries');

const assertImportTablesExist = async () => {
  const exists = await naldQueries.importTableExists();
  if (!exists) {
    throw new NALDImportTablesError();
  }
};

exports.assertImportTablesExist = assertImportTablesExist;
