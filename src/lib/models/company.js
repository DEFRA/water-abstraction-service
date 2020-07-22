'use strict';

const Joi = require('@hapi/joi');
const validators = require('./validators');

const TYPE_PERSON = 'person';
const TYPE_ORGANISATION = 'organisation';

const VALID_TYPE = Joi.string().valid(TYPE_PERSON, TYPE_ORGANISATION).required();
const VALID_NAME = Joi.string().required();

const ORGANISATION_TYPES = {
  limitedCompany: 'limitedCompany',
  limitedLiabilityPartnership: 'limitedLiabilityPartnership',
  publicLimitedCompany: 'publicLimitedCompany'
};

const Model = require('./model');

class Company extends Model {
  /**
   * @param {String} type - Company type person|organisation
   */
  set type (type) {
    Joi.assert(type, VALID_TYPE);
    this._type = type;
  }

  get type () {
    return this._type;
  }

  /**
   * @param {String} type - Company name (or full name if individual)
   */
  set name (name) {
    Joi.assert(name, VALID_NAME);
    this._name = name;
  }

  get name () {
    return this._name;
  }

  /**
   * Organisation type
   * @param {String} organisationType - Organisation type
   */
  set organisationType (organisationType) {
    validators.assertNullableEnum(organisationType, Object.values(ORGANISATION_TYPES));
    this._organisationType = organisationType;
  }

  get organisationType () {
    return this._organisationType;
  }

  /**
   * Company number
   * @param {String} companyNumber
   */
  set companyNumber (companyNumber) {
    validators.assertNullableString(companyNumber);
    this._companyNumber = companyNumber;
  }

  get companyNumber () {
    return this._companyNumber;
  }
}

module.exports = Company;
module.exports.TYPE_ORGANISATION = TYPE_ORGANISATION;
module.exports.TYPE_PERSON = TYPE_PERSON;
module.exports.ORGANISATION_TYPES = ORGANISATION_TYPES;
