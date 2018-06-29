class LicenceNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'LicenceNotFoundError';
  }
}

module.exports = {
  LicenceNotFoundError
};
