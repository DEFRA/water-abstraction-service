'use strict';

const Joi = require('@hapi/joi');
const { assert } = require('@hapi/hoek');
const { get, flatMap } = require('lodash');

const Address = require('./address');
const InvoiceAccount = require('./invoice-account');
const InvoiceLicence = require('./invoice-licence');
const { isArrayOfType } = require('./validators');

const MINIMUM_PAYMENT = 25 * 100; // £25
const VALID_GUID = Joi.string().guid().required();

const getTotalsCredit = (totals, value) => {
  return {
    totalCredits: totals.totalCredits + value,
    numberOfCredits: totals.numberOfCredits + 1
  };
};

const getTotalsInvoice = (totals, value) => {
  return {
    totalInvoices: totals.totalInvoices + value,
    numberOfInvoices: totals.numberOfInvoices + 1
  };
};

const getTotalsChange = (totals, value, isCredit) => {
  const change = isCredit
    ? getTotalsCredit(totals, value)
    : getTotalsInvoice(totals, value);

  return {
    ...change,
    totalValue: totals.totalValue + (isCredit ? -1 * value : value)
  };
};

class Invoice {
  constructor (id) {
    if (id) {
      this.id = id;
    }
    this._invoiceLicences = [];
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

  set invoiceLicences (invoiceLicences) {
    isArrayOfType(invoiceLicences, InvoiceLicence);
    this._invoiceLicences = invoiceLicences;
  }

  get invoiceLicences () {
    return this._invoiceLicences;
  }

  /**
   * Gets an object containing the total values and number
   * of charge types for this invoice in the shape:
   *
   * {
   *   totalValue: Number,
   *   totalInvoices: Number,
   *   totalCredits: Number,
   *   numberOfInvoices: Number,
   *   numberOfCredits: Number
   * }
   */
  getTotals () {
    const transactions = this.invoiceLicences.reduce((acc, invoiceLicence) => {
      return [...acc, ...invoiceLicence.transactions];
    }, []);

    return transactions.reduce((totals, { isCredit, value }) => {
      const change = getTotalsChange(totals, value, isCredit);
      return { ...totals, ...change };
    }, {
      totalValue: 0,
      totalInvoices: 0,
      totalCredits: 0,
      numberOfInvoices: 0,
      numberOfCredits: 0
    });
  }

  /**
   * Get the licence numbers for this invoice by inspecting
   * the Licence objects associated with each InvoiceLicence
   * object associated with this invoice
   */
  getLicenceNumbers () {
    return flatMap(this.invoiceLicences, invoiceLicence => {
      return get(invoiceLicence, 'licence.licenceNumber');
    });
  }

  /**
   * Gets the number of pence that are required to add to the invoice
   * to satisfy the minimum charge of £25.
   */
  getMinimumPaymentTopUp () {
    const { totalValue } = this.getTotals();
    return totalValue < MINIMUM_PAYMENT ? MINIMUM_PAYMENT - totalValue : 0;
  }

  getInvoiceLicenceContacts () {
    return Object.values(this.invoiceLicences.reduce((acc, invoiceLicence) => {
      const contact = get(invoiceLicence, 'contact');
      const contactId = get(contact, 'id');

      if (contactId && !acc[contactId]) {
        acc[contactId] = contact;
      }
      return acc;
    }, {}));
  }

  toJSON () {
    return {
      id: this.id,
      invoiceAccount: this.invoiceAccount,
      invoiceLicences: this.invoiceLicences,
      totals: this.getTotals()
    };
  }
}

module.exports = Invoice;
