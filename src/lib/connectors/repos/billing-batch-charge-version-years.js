'use strict';

const { BillingBatchChargeVersionYear, bookshelf } = require('../bookshelf');
const raw = require('./lib/raw');
const helpers = require('./lib/helpers');
const queries = require('./queries/billing-batch-charge-version-years');
const { TRANSACTION_TYPE } = require('../../models/charge-version-year');

/**
 * Finds a charge version year with related model data by ID
 * @param {String} id
 */
const findOne = async id => {
  const withRelated = [
    'billingBatch',
    'billingBatch.region',
    'chargeVersion',
    'chargeVersion.changeReason',
    'chargeVersion.chargeElements',
    'chargeVersion.chargeElements.purposePrimary',
    'chargeVersion.chargeElements.purposeSecondary',
    'chargeVersion.chargeElements.purposeUse',
    'chargeVersion.licence',
    'chargeVersion.licence.licenceAgreements',
    'chargeVersion.licence.licenceAgreements.financialAgreementType'
  ];

  return helpers.findOne(BillingBatchChargeVersionYear, 'billingBatchChargeVersionYearId', id, withRelated);
};

const update = (id, data) =>
  BillingBatchChargeVersionYear
    .forge({ billingBatchChargeVersionYearId: id })
    .save(data);

/**
 * Gets a count of the charge version years in each status by batch ID
 * @param {String} batchId - guid
 */
const findStatusCountsByBatchId = batchId =>
  raw.multiRow(queries.findStatusCountsByBatchId, { batchId });

/**
 * Deletes all billing batch charge version years for given batch
 * @param {String} batchId - guid
 * @param {String} isDeletionRequired - boolean
 */
const deleteByBatchId = async (batchId, isDeletionRequired = true) => BillingBatchChargeVersionYear
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy({ require: isDeletionRequired });

/*
  * Deletes all charge version years associated with an invoice ID
  * @param {String} billingInvoiceId
  * @return {Promise}
  */
const deleteByInvoiceId = billingInvoiceId => bookshelf
  .knex
  .raw(queries.deleteByInvoiceId, { billingInvoiceId });

/**
 * Finds all charge version years for the supplied batch ID
 * @param {String} billingBatchId
 */
const findByBatchId = async billingBatchId => {
  const conditions = {
    billing_batch_id: billingBatchId
  };

  return helpers.findMany(BillingBatchChargeVersionYear, conditions);
};

/**
 * Finds water.billing_batch_charge_version_years records in batch where
 * a two-part tariff agreement applies
 * @param {String} billingBatchId
 * @return {Promise<Array>}
 */
const findTwoPartTariffByBatchId = async billingBatchId => {
  const conditions = {
    billing_batch_id: billingBatchId,
    transaction_type: TRANSACTION_TYPE.twoPartTariff
  };

  return helpers.findMany(BillingBatchChargeVersionYear, conditions);
};

/**
 * Deletes charge version years in a batch for a particular licence ID
 * @param {String} billingBatchId
 * @param {String} licenceId
 */
const deleteByBatchIdAndLicenceId = (billingBatchId, licenceId, twoPartTarrifOnly = false) => {
  return twoPartTarrifOnly
    ? bookshelf.knex.raw(queries.deleteByBatchIdAndLicenceId, { billingBatchId, licenceId })
    : bookshelf.knex.raw(queries.delete2PTByBatchIdAndLicenceId, { billingBatchId, licenceId });
};

/**
 * Creates a new record in water.billing_batch_charge_version_years
 * @param {String} billingBatchId
 * @param {String} chargeVersionId
 * @param {Number} financialYearEnding
 * @param {String} data.status
 * @param {String} data.transactionType annual | two_part_tariff
 * @param {Boolean} data.isSummer
 */
const create = async data => helpers.create(BillingBatchChargeVersionYear, data);

exports.findOne = findOne;
exports.update = update;
exports.findStatusCountsByBatchId = findStatusCountsByBatchId;
exports.deleteByBatchId = deleteByBatchId;
exports.deleteByInvoiceId = deleteByInvoiceId;
exports.findByBatchId = findByBatchId;
exports.findTwoPartTariffByBatchId = findTwoPartTariffByBatchId;
exports.deleteByBatchIdAndLicenceId = deleteByBatchIdAndLicenceId;
exports.create = create;
