'use strict';

const Model = require('./model');
const validators = require('./validators');
const Joi = require('@hapi/joi');

const mandatoryPostcodeCountries = [
  'united kingdom',
  'england',
  'wales',
  'scotland',
  'northern ireland',
  'uk'
];

// https://en.wikipedia.org/wiki/Postcodes_in_the_United_Kingdom#Validation
const postcodeRegex = /^(([A-Z]{1,2}[0-9][A-Z0-9]?|ASCN|STHL|TDCU|BBND|[BFS]IQQ|PCRN|TKCA) ?[0-9][A-Z]{2}|BFPO ?[0-9]{1,4}|(KY[0-9]|MSR|VG|AI)[ -]?[0-9]{4}|[A-Z]{2} ?[0-9]{2}|GE ?CX|GIR ?0A{2}|SAN ?TA1)$/;

const newAddressSchema = Joi.object({
  addressLine1: Joi.string().optional(),
  addressLine2: Joi.string().optional(),
  addressLine3: Joi.when('addressLine2', { is: null, then: Joi.string().required(), otherwise: Joi.string().optional() }),
  addressLine4: Joi.string().optional(),
  town: Joi.when('addressLine4', { is: null, then: Joi.string().required(), otherwise: Joi.string().optional() }),
  county: Joi.string().optional(),
  country: Joi.string().required(),
  postcode: Joi.string().trim().empty('').default(null).optional().when('country', {
    is: Joi.string().lowercase().replace(/\./g, '').valid(mandatoryPostcodeCountries),
    then: Joi.string().required()
      // uppercase and remove any spaces (BS1 1SB -> BS11SB)
      .uppercase().replace(/ /g, '')
      // then ensure the space is before the inward code (BS11SB -> BS1 1SB)
      .replace(/(.{3})$/, ' $1').regex(postcodeRegex),
    otherwise: Joi.string().optional().allow(null)
  }),
  uprn: Joi.number().integer().min(0).default(null).allow(null)
}).or('addressLine2', 'addressLine3').or('addressLine4', 'town');

const ADDRESS_SOURCE = {
  nald: 'nald',
  wrls: 'wrls',
  eaAddressFacade: 'ea-address-facade'
};

class Address extends Model {
  set addressLine1 (addressLine1) {
    validators.assertNullableString(addressLine1);
    this._addressLine1 = addressLine1;
  }

  get addressLine1 () {
    return this._addressLine1;
  }

  set addressLine2 (addressLine2) {
    validators.assertNullableString(addressLine2);
    this._addressLine2 = addressLine2;
  }

  get addressLine2 () {
    return this._addressLine2;
  }

  set addressLine3 (addressLine3) {
    validators.assertNullableString(addressLine3);
    this._addressLine3 = addressLine3;
  }

  get addressLine3 () {
    return this._addressLine3;
  }

  set addressLine4 (addressLine4) {
    validators.assertNullableString(addressLine4);
    this._addressLine4 = addressLine4;
  }

  get addressLine4 () {
    return this._addressLine4;
  }

  set town (town) {
    validators.assertNullableString(town);
    this._town = town;
  }

  get town () {
    return this._town;
  }

  set county (county) {
    validators.assertNullableString(county);
    this._county = county;
  }

  get county () {
    return this._county;
  }

  set postcode (postcode) {
    validators.assertNullableString(postcode);
    this._postcode = postcode;
  }

  get postcode () {
    return this._postcode;
  }

  set country (country) {
    validators.assertNullableString(country);
    this._country = country;
  }

  get country () {
    return this._country;
  }

  /**
   * Indicates the source of the data - NALD, WRLS manual entry or EA address facade
   * @param {String} wrls|nald|ea-address-facade
   */
  set source (source) {
    validators.assertEnum(source, Object.values(ADDRESS_SOURCE));
    this._source = source;
  }

  get source () {
    return this._source;
  }

  /**
   * Unique place name reference
   * @param {Number} uprn
   */
  set uprn (uprn) {
    validators.assertNullablePositiveOrZeroInteger(uprn);
    this._uprn = uprn;
  }

  get uprn () {
    return this._uprn;
  }

  /**
   * Returns all properties as a plain JS object
   * @return {Object}
   */
  toObject () {
    return {
      id: this.id,
      addressLine1: this.addressLine1,
      addressLine2: this.addressLine2,
      addressLine3: this.addressLine3,
      addressLine4: this.addressLine4,
      town: this.town,
      county: this.county,
      postcode: this.postcode,
      country: this.country
    };
  }

  isValid () {
    return Joi.validate(this.toJSON(), newAddressSchema, { abortEarly: false });
  }
}

module.exports = Address;
module.exports.ADDRESS_SOURCE = ADDRESS_SOURCE;
