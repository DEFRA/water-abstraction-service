'use strict';
const CompanyAddress = require('./company-address');
const CompanyContact = require('./company-contact');

const TYPE_PERSON = 'person';
const TYPE_ORGANISATION = 'organisation';
const COMPANY_TYPES = [TYPE_PERSON, TYPE_ORGANISATION];

const ORGANISATION_TYPES = ['individual', 'limitedCompany', 'partnership', 'limitedLiabilityPartnership'];

const validators = require('./validators');

const Model = require('./model');

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
    validators.assertEnum(type, COMPANY_TYPES);
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
 * @param {String} type - Company type person|organisation
 */
  set organisationType (organisationType) {
    validators.assertNullableEnum(organisationType, ORGANISATION_TYPES);
    this._organisationType = organisationType;
  }

  get organisationType () {
    return this._organisationType;
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
}

module.exports = Company;
module.exports.TYPE_ORGANISATION = TYPE_ORGANISATION;
module.exports.TYPE_PERSON = TYPE_PERSON;
module.exports.ORGANISATION_TYPES = ORGANISATION_TYPES;
