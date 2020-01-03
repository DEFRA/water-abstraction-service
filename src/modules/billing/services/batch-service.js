const Batch = require('../../../lib/models/batch');
const invoiceService = require('./invoice-service');

/**
 * Maps the charge data to water service models ready for use
 * within this service
 * @param {String} batchId - the guid batch ID in water.billing_batches
 * @param {Array} data - array of data from charge processor
 * @return {Batch} water Batch instance
 */
const mapChargeDataToModel = (batchId, data) => {
  // Create batch
  const batch = new Batch();
  batch.id = batchId;

  // Add invoices to batch
  batch.addInvoices(invoiceService.mapChargeDataToModels(data));

  return batch;
};

exports.mapChargeDataToModel = mapChargeDataToModel;
