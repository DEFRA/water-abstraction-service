'use strict';

const Model = require('./model');
const { assertLicenceNumber } = require('./validators');

class Licence extends Model {
  set licenceNumber (licenceNumber) {
    assertLicenceNumber(licenceNumber);
    this._licenceNumber = licenceNumber;
  }

  get licenceNumber () {
    return this._licenceNumber;
  }
}

module.exports = Licence;
