'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingInvoiceLicence', {
  tableName: 'billing_invoice_licences',

  hasTimestamps: ['date_created', 'date_updated'],

  billingInvoice () {
    return this.belongsTo('BillingInvoice', 'billing_invoice_id', 'billing_invoice_id');
  },

  billingTransactions () {
    return this.hasMany('BillingTransaction', 'billing_invoice_licence_id', 'billing_invoice_licence_id');
  },

  licence () {
    return this.hasOne('Licence', 'licence_id', 'licence_id');
  }
});
