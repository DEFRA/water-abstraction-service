'use strict';

const { get, flatMap } = require('lodash');

const { assertIsInstanceOf, assertIsArrayOfType, assertIsNullableInstanceOf } = require('./validators');
const Model = require('./model');
const Address = require('./address');
const InvoiceAccount = require('./invoice-account');
const InvoiceLicence = require('./invoice-licence');
const Company = require('./company');
const Contact = require('./contact-v2');

const Totals = require('./totals');

class Invoice extends Model {
  constructor (id) {
    super(id);
    this._invoiceLicences = [];
  }

  /**
   * Sets the invoice account instance for this invoice
   * @param {InvoiceAccount} invoiceAccount
   */
  set invoiceAccount (invoiceAccount) {
    assertIsInstanceOf(invoiceAccount, InvoiceAccount);
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
    assertIsInstanceOf(address, Address);
    this._address = address;
  }

  /**
   * Gets the address instance for this invoice
   * @return {Address}
   */
  get address () {
    return this._address;
  }

  /**
   * Sets the agent company
   * @param {Company} company
   */
  set agentCompany (company) {
    assertIsNullableInstanceOf(company, Company);
    this._agentCompany = company;
  }

  /**
   * Gets the agent company
   * @return {Company}
   */
  get agentCompany () {
    return this._agentCompany;
  }

  /**
   * Sets the contact - for FAO
   * @param {Contact} contact
   */
  set contact (contact) {
    assertIsNullableInstanceOf(contact, Contact);
    this._contact = contact;
  }

  /**
   * Gets the agent company
   * @return {Contact}
   */
  get contact () {
    return this._contact;
  }

  /**
   * Sets the date created for this invoice
   * @param {String} dateCreated
   */
  set dateCreated (dateCreated) {
    this._dateCreated = dateCreated;
  }

  /**
   * Gets the date created for this invoice
   * @return {String}
   */
  get dateCreated () {
    return this._dateCreated;
  }

  set invoiceLicences (invoiceLicences) {
    assertIsArrayOfType(invoiceLicences, InvoiceLicence);
    this._invoiceLicences = invoiceLicences;
  }

  get invoiceLicences () {
    return this._invoiceLicences;
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
   * The charge module summary contains data on
   * invoice/credit count, invoice/credit totals, net total
   * @param {Totals} totals
   */
  set totals (totals) {
    assertIsInstanceOf(totals, Totals);
    this._totals = totals;
  }

  get totals () {
    return this._totals;
  }

  toJSON () {
    return {
      ...super.toJSON()
    };
  }
}

module.exports = Invoice;
