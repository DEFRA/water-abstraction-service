'use strict';
const Model = require('./model');
const CompanyAddress = require('./company-address');
const CompanyContact = require('./company-contact');

const validators = require('./validators');
const Joi = require('joi');

const COMPANY_TYPES = {
  person: 'person',
  organisation: 'organisation'
};

const ORGANISATION_TYPES = {
  individual: 'individual',
  limitedCompany: 'limitedCompany',
  limitedLiabilityPartnership: 'limitedLiabilityPartnership',
  publicLimitedCompany: 'publicLimitedCompany'
};

const newCompanySchema = Joi.object().keys({
  type: Joi.string().valid(...Object.values(COMPANY_TYPES)).required(),
  organisationType: Joi.string().valid(...Object.values(ORGANISATION_TYPES)).required(),
  name: Joi.string().required(),
  companyNumber: Joi.string().length(8).optional(),
  companyAddresses: Joi.array().optional(),
  companyContacts: Joi.array().optional()
});

class Company extends Model {
  constructor (id) {
    super(id);
    this._companyAddresses = [];
    this._companyContacts = [];
  }

  /**
   * @param {String} type - Company type person|organisation
   */
  set type (type) {
    validators.assertEnum(type, Object.values(COMPANY_TYPES));
    this._type = type;
  }

  get type () {
    return this._type;
  }

  /**
   * @param {String} type - Company name (or full name if individual)
   */
  set name (name) {
    validators.assertString(name);
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

  /**
 * @param {Array} companyAddresses - addresses linked to company
 */
  set companyAddresses (companyAddresses) {
    validators.assertIsArrayOfType(companyAddresses, CompanyAddress);
    this._companyAddresses = companyAddresses;
  }

  get companyAddresses () {
    return this._companyAddresses;
  }

  /**
* @param {Array} companyContacts - contacts linked to company
*/
  set companyContacts (companyContacts) {
    validators.assertIsArrayOfType(companyContacts, CompanyContact);
    this._companyContacts = companyContacts;
  }

  get companyContacts () {
    return this._companyContacts;
  }

  isValid () {
    return Joi.validate(this.toJSON(), newCompanySchema, { abortEarly: false });
  }
}

module.exports = Company;
module.exports.COMPANY_TYPES = COMPANY_TYPES;
module.exports.ORGANISATION_TYPES = ORGANISATION_TYPES;
