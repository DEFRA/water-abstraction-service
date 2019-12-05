const Joi = require('@hapi/joi');
const Address = require('./address.js');
const Company = require('./company');
const Contact = require('./contact-v2');
const Licence = require('./licence');
const { assert } = require('@hapi/hoek');
const { get } = require('lodash');

const VALID_GUID = Joi.string().guid().required();

class InvoiceLicence {
  constructor () {
    this._transactions = [];
  }

  /**
   * Sets the ID for this invoice
   * @param {String} - GUID
   */
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  /**
   * Gets the ID for this invoice
   * @return {String}
   */
  get id () {
    return this._id;
  }

  /**
  * Sets the licence instance
  * @param {Licence} licence
  */
  set licence (licence) {
    assert(licence instanceof Licence, 'Licence expected');
    this._licence = licence;
  }

  /**
   * Gets the licence instance
   * @return {Address}
   */
  get licence () {
    return this._licence;
  }

  /**
  * Sets the company instance for this licence holder
  * @param {Company} company
  */
  set company (company) {
    assert(company instanceof Company, 'Company expected');
    this._company = company;
  }

  /**
   * Gets the address instance for this licence holder
   * @return {Address}
   */
  get company () {
    return this._company;
  }

  /**
  * Sets the contact instance for this licence holder
  * @param {Contact} contact
  */
  set contact (contact) {
    assert(contact instanceof Contact, 'Contact expected');
    this._contact = contact;
  }

  /**
   * Gets the contact instance for this licence holder
   * @return {Contact}
   */
  get contact () {
    return this._contact;
  }

  /**
   * Sets the address instance for this licence holder
   * @param {Address} address
   */
  set address (address) {
    assert(address instanceof Address, 'Address expected');
    this._address = address;
  }

  /**
   * Gets the address instance for this licence holder
   * @return {Address}
   */
  get address () {
    return this._address;
  }

  /**
   * Gets a unique ID for this invoice licence which can be used
   * for unique comparisons
   * @return {String}
   */
  get uniqueId () {
    return [
      get(this, '_licence.licenceNumber'),
      get(this, '_company.companyId'),
      get(this, '_address.addressId'),
      get(this, '_contact.contactId')
    ].join('.');
  }
}

module.exports = InvoiceLicence;
