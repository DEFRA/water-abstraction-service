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

module.exports = {
  LicenceNotFoundError,
  MetaDataError
};
