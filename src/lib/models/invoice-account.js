const Joi = require('@hapi/joi');
const VALID_GUID = Joi.string().guid().required();
const VALID_ACCOUNT_NUMBER = Joi.string().regex(/^[ABENSTWY][0-9]{8}A$/).required();

class InvoiceAccount {
  /**
   * Sets the CRM invoice account ID
   * @param {String} id - GUID
   */
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  /**
   * Gets the CRM invoice account ID
   * @return {String} - GUID
   */
  get id () {
    return this._id;
  }

  /**
   * Sets the invoice account number
   * Must be in the form [region letter]01234567A
   * @param {String} accountNumber
   */
  set accountNumber (accountNumber) {
    Joi.assert(accountNumber, VALID_ACCOUNT_NUMBER);
    this._accountNumber = accountNumber;
  }

  /**
   * Gets the invoice account number
   * @return {String}
   */
  get accountNumber () {
    return this._accountNumber;
  }
}

module.exports = InvoiceAccount;
