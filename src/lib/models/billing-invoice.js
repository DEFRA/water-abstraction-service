const Joi = require('@hapi/joi');
const Address = require('./address');

const VALID_GUID = Joi.string().guid().required();
const VALID_INVOICE_ACCOUNT_NUMBER = Joi.string().pattern(/^[ABENSTWY][0-9]{8}A$/).required();

class BillingInvoice {
  set id (id) {
    Joi.assert(id, VALID_GUID);
    this._id = id;
  }

  get id () {
    return this._id;
  }

  set invoiceAccountId (invoiceAccountId) {
    Joi.assert(invoiceAccountId, VALID_GUID);
    this._invoiceAccountId = invoiceAccountId;
  }

  get invoiceAccountId () {
    return this._invoiceAccountId;
  }

  set invoiceAccountNumber (invoiceAccountNumber) {
    Joi.assert(invoiceAccountNumber, VALID_INVOICE_ACCOUNT_NUMBER);
    this._invoiceAccountNumber = invoiceAccountNumber;
  }

  get invoiceAccountNumber () {
    return this._invoiceAccountNumber;
  }

  set address (address) {
    if (!(address instanceof Address)) {
      throw new Error('Instance of Address expected');
    }
    this._address = address;
  }

  get address () {
    return this._address;
  }
}

module.exports = BillingInvoice;
