const { bookshelf } = require('../../../connectors/bookshelf');

module.exports = bookshelf.model('BillingTransaction', {
  tableName: 'billing_transactions',
  idAttribute: 'billing_transaction_id',
  billingInvoiceLicence () {
    return this.hasOne('BillingInvoiceLicence', 'billing_invoice_licence_id', 'billing_invoice_licence_id');
  },
  chargeElement () {
    return this.hasOne('ChargeElement', 'charge_element_id', 'charge_element_id');
  }
});
