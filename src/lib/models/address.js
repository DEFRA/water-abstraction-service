const Joi = require('@hapi/joi');

const VALID_STRING = Joi.string().allow(null).required();

class Address {
  set addressLine1 (addressLine1) {
    Joi.assert(addressLine1, VALID_STRING);
    this._addressLine1 = addressLine1;
  }

  get addressLine1 () {
    return this._addressLine1;
  }

  set addressLine2 (addressLine2) {
    Joi.assert(addressLine2, VALID_STRING);
    this._addressLine2 = addressLine2;
  }

  get addressLine2 () {
    return this._addressLine2;
  }

  set addressLine3 (addressLine3) {
    Joi.assert(addressLine3, VALID_STRING);
    this._addressLine3 = addressLine3;
  }

  get addressLine3 () {
    return this._addressLine3;
  }

  set addressLine4 (addressLine4) {
    Joi.assert(addressLine4, VALID_STRING);
    this._addressLine4 = addressLine4;
  }

  get addressLine4 () {
    return this._addressLine4;
  }

  set town (town) {
    Joi.assert(town, VALID_STRING);
    this._town = town;
  }

  get town () {
    return this._town;
  }

  set county (county) {
    Joi.assert(county, VALID_STRING);
    this._county = county;
  }

  get county () {
    return this._county;
  }

  set postcode (postcode) {
    Joi.assert(postcode, VALID_STRING);
    this._postcode = postcode;
  }

  get postcode () {
    return this._postcode;
  }

  set country (country) {
    Joi.assert(country, VALID_STRING);
    this._country = country;
  }

  get country () {
    return this._country;
  }
}

module.exports = Address;
