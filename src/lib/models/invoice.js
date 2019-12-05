const Joi = require('@hapi/joi');
const Address = require('./address.js');
const InvoiceAccount = require('./invoice-account.js');
const { assert } = require('@hapi/hoek');

const VALID_GUID = Joi.string().guid().required();

class Invoice {
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
   * Sets the invoice account instance for this invoice
   * @param {InvoiceAccount} invoiceAccount
   */
  set invoiceAccount (invoiceAccount) {
    assert(invoiceAccount instanceof InvoiceAccount, 'InvoiceAccount expected');
    this._invoiceAccount = invoiceAccount;
  }

  /**
   * Gets the invoice account instance for this invoice
   * @return {InvoiceAccount}
   */
  get invoiceAccount () {
    return this._invoiceAccount;
  }

  /**
   * Sets the address instance for this invoice
   * @param {Address} address
   */
  set address (address) {
    assert(address instanceof Address, 'Address expected');
    this._address = address;
  }

  /**
   * Gets the address instance for this invoice
   * @return {Address}
   */
  get address () {
    return this._address;
  }
}

module.exports = Invoice;
