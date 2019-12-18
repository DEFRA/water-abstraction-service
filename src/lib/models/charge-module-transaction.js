const Model = require('./model');
const { assertAccountNumber, assertLicenceNumber } = require('./validators');

class ChargeModuleTransaction extends Model {
  get licenceNumber () {
    return this._licenceNumber;
  }

  set licenceNumber (licenceNumber) {
    assertLicenceNumber(licenceNumber);
    this._licenceNumber = licenceNumber;
  }

  get accountNumber () {
    return this._accountNumber;
  }

  set accountNumber (accountNumber) {
    assertAccountNumber(accountNumber);
    this._accountNumber = accountNumber;
  }

  get isCredit () {
    return this._isCredit;
  }

  set isCredit (isCredit) {
    this._isCredit = isCredit;
  }

  get value () {
    return this._value;
  }

  set value (value) {
    this._value = value;
  }
}

module.exports = ChargeModuleTransaction;
