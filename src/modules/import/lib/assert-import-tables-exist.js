const { NALDImportTablesError } = require('./errors');
const { importTableExists } = require('./nald-queries');

const assertImportTablesExist = async () => {
  const exists = await importTableExists();
  if (!exists) {
    throw new NALDImportTablesError();
  }
};

exports.assertImportTableExists = assertImportTablesExist;
