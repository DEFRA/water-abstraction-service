const { DBError } = require('../../../lib/errors');

class LicenceNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceNotFoundError';
  }
}

class MetaDataError extends Error {
  constructor (message) {
    super(message);
    this.name = 'MetaDataError';
  }
}

class NALDImportTablesError extends DBError {
  constructor (message) {
    super(message);
    this.name = 'NALDImportTablesError';
  }
}

module.exports = {
  LicenceNotFoundError,
  MetaDataError,
  NALDImportTablesError
};
