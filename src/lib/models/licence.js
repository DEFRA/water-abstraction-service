'use strict';

const Joi = require('@hapi/joi');

const VALID_GUID = Joi.string().guid().required();
const VALID_LICENCE_NUMBER = Joi.string().regex(/^[&()*-./0-9A-Z]+$/).required();
const VALID_ACCOUNT_NUMBER = Joi.string().regex(/^[ABENSTWY][0-9]{8}A$/).required();

class Licence {
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
   * Sets the ID for this invoice
   * @param {String} - GUID
   */
  set licenceNumber (licenceNumber) {
    Joi.assert(licenceNumber, VALID_LICENCE_NUMBER);
    this._licenceNumber = licenceNumber;
  }

  /**
   * Gets the ID for this invoice
   * @return {String}
   */
  get licenceNumber () {
    return this._licenceNumber;
  }

  set accountNumber (accountNumber) {
    Joi.assert(accountNumber, VALID_ACCOUNT_NUMBER);
    this._accountNumber = accountNumber;
  }

  get accountNumber () {
    return this._accountNumber;
  }

  toJSON () {
    return {
      id: this.id,
      licenceNumber: this.licenceNumber
    };
  }
}

module.exports = Licence;
