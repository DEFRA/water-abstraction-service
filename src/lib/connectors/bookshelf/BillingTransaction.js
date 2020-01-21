const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingTransaction', {
  tableName: 'billing_transactions',
  billingInvoiceLicence () {
    return this.hasOne('BillingInvoiceLicence', 'billing_invoice_licence_id', 'billing_invoice_licence_id');
  },
  chargeElement () {
    return this.hasOne('ChargeElement', 'charge_element_id', 'charge_element_id');
  }
});
