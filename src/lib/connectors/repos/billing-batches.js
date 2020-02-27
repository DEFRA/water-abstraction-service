'use strict';

const { BillingBatch } = require('../bookshelf');
const { paginatedEnvelope } = require('./lib/envelope');

const findOne = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region'
      ]
    });

  return model.toJSON();
};

const findPage = async (page, pageSize) => {
  const result = await BillingBatch
    .forge()
    .orderBy('date_created', 'DESC')
    .fetchPage({
      page,
      pageSize,
      withRelated: [
        'region'
      ]
    });
  return paginatedEnvelope(result);
};

const findByStatuses = async statuses => {
  const batches = await BillingBatch
    .forge()
    .query('whereIn', 'status', statuses)
    .orderBy('date_created', 'desc')
    .fetchAll({ withRelated: ['region'] });

  return batches.toJSON();
};

/**
 * Updates a billing_batch records for the given id
 *
 * @param {String} batchId UUID of the batch to update
 * @param {Object} changes Key values pairs of the changes to make
 */
const update = (batchId, changes) => BillingBatch
  .forge({ billingBatchId: batchId })
  .save(changes);

/**
 * Deletes the billing_batch record with the given id
 *
 * @param {String} batchId UUID of the batch to delete
 */
const deleteById = batchId => BillingBatch
  .forge({ billingBatchId: batchId })
  .destroy();

const findOneWithInvoices = async (id) => {
  const model = await BillingBatch
    .forge({ billingBatchId: id })
    .fetch({
      withRelated: [
        'region',
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.licence',
        'billingInvoices.billingInvoiceLicences.licence.region'

      ]
    });

  return model.toJSON();
};

exports.delete = deleteById;
exports.findByStatuses = findByStatuses;
exports.findOne = findOne;
exports.findPage = findPage;
exports.update = update;
exports.findOneWithInvoices = findOneWithInvoices;
