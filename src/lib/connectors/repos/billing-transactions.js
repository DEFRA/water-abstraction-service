const { BillingTransaction } = require('../bookshelf');

/**
 * Gets transaction and related models by GUID
 * @param {String} id - guid
 * @return {Object}
 */
const findOne = async id => {
  const model = await new BillingTransaction({ billing_transaction_id: id })
    .fetch({
      withRelated: [
        'chargeElement',
        'billingInvoiceLicence',
        'billingInvoiceLicence.licence',
        'billingInvoiceLicence.licence.region',
        'billingInvoiceLicence.billingInvoice',
        'billingInvoiceLicence.billingInvoice.billingBatch',
        'billingInvoiceLicence.billingInvoice.billingBatch.region'
      ]
    });

  return model.toJSON();
};

exports.findOne = findOne;
