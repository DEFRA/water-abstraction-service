'use strict';

const Model = require('./model');
const validators = require('./validators');
const Joi = require('joi');
const { identity, pick } = require('lodash');
const { VALID_ADDRESS } = require('@envage/water-abstraction-helpers').validators;

const ADDRESS_SOURCE = {
  nald: 'nald',
  wrls: 'wrls',
  eaAddressFacade: 'ea-address-facade',
  companiesHouse: 'companies-house'
};

const UK_COUNTRIES = [
  'united kingdom',
  'england',
  'wales',
  'scotland',
  'northern ireland',
  'uk'
];

/**
 * Zero pads integers within an address line for sorting
 *
 * @param {String} addressLine
 * @return {String} address line with numeric components zero-padded
 */
const zeroPad = addressLine =>
  addressLine.replace(/[0-9]+/, match => match.padStart(7, '0'));

/**
 * Gets a string which can be used for sorting addresses
 * The address is reversed, normalized, and numeric parts in the
 * first 4 address lines are zero padded for consistent sorting
 *
 * @param {Address} address
 * @return {String}
 */
const getSortKey = address => {
  return [
    ...[
      address.addressLine1,
      address.addressLine2,
      address.addressLine3,
      address.addressLine4
    ].filter(identity).map(zeroPad),
    address.town,
    address.county,
    address.postcode,
    address.country
  ].reverse()
    .filter(identity)
    .map(str => str.toUpperCase().replace(/ /, '_'))
    .join('_');
};

const mapToValidator = address => ({
  ...pick(address,
    [
      'addressLine1',
      'addressLine2',
      'addressLine3',
      'addressLine4',
      'town',
      'county',
      'postcode',
      'country',
      'uprn'
    ]),
  dataSource: address.source
});

class Address extends Model {
  constructor (...args) {
    super(...args);
    this.addressLine1 = null;
    this.addressLine2 = null;
    this.addressLine3 = null;
    this.addressLine4 = null;
    this.town = null;
    this.county = null;
    this.postcode = null;
    this.country = null;
    this.uprn = null;
  }

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

  /**
   * Validate the address
   * @return { error, value }
   */
  validate () {
    // Skip validation for NALD/companies house addresses
    const schema = [ADDRESS_SOURCE.nald, ADDRESS_SOURCE.companiesHouse].includes(this.source)
      ? Joi.object()
      : VALID_ADDRESS;

    const mappedAddress = mapToValidator(this);
    return Joi.validate(mappedAddress, schema, { abortEarly: false });
  }

  get sortKey () {
    return getSortKey(this);
  }

  /**
   * Checks if an international address
   * @return {Boolean}
   */
  get isUKAddress () {
    // Some NALD addresses have a null country - treat as UK
    if (this.source === ADDRESS_SOURCE.nald && this.country === null) {
      return true;
    }
    // Otherwise use list of UK countries
    return UK_COUNTRIES.includes(this.country.trim().toLowerCase());
  }
}

module.exports = Address;
module.exports.ADDRESS_SOURCE = ADDRESS_SOURCE;
