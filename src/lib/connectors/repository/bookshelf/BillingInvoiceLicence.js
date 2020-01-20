const { bookshelf } = require('../../bookshelf');

module.exports = bookshelf.model('BillingInvoiceLicence', {
  tableName: 'billing_invoice_licences',
  idAttribute: 'billing_invoice_licence_id',

  billingInvoice () {
    return this.hasOne('BillingInvoice', 'billing_invoice_id', 'billing_invoice_id');
  },

  billingTransactions () {
    return this.hasMany('BillingTransaction', 'billing_invoice_licence_id', 'billing_invoice_licence_id');
  }
});
