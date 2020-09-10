'use strict';

const raw = require('./lib/raw');
const { Licence, bookshelf } = require('../bookshelf');
const queries = require('./queries/licences');

/**
 * Gets a list of licence agreements of the given types for the specified
 * licece number
 * @param {String} licenceRef - licence number
 * @param {Array} agreementTypes
 * @return {Promise<Array>}
 */
const findOne = async licenceId => {
  const model = await Licence
    .forge({ licenceId })
    .fetch({
      withRelated: [
        'region'
      ]
    });

  return model ? model.toJSON() : null;
};

const findByLicenceRef = async licenceRef => {
  const model = await Licence
    .forge()
    .where({ licence_ref: licenceRef })
    .fetchAll({
      withRelated: ['region']
    });

  return model.toJSON();
};

/**
 * Gets a list of licences in the supplied billing batch, which have a
 * billing volume for TPT review
 * @param {String} billingBatchId
 * @return {Promise<Array>}
 */
const findByBatchIdForTwoPartTariffReview = billingBatchId =>
  raw.multiRow(queries.findByBatchIdForTwoPartTariffReview, { billingBatchId });

/**
 * Updates a water.licences record for the given id
 *
 * @param {String} licenceId UUID of the licence to update
 * @param {Object} changes Key values pairs of the changes to make
 */
const update = (licenceId, changes) => Licence
  .forge({ licenceId })
  .save(changes, { patch: true });

const updateIncludeLicenceInSupplementaryBilling = (licenceId, from, to) => {
  const options = {
    require: false,
    patch: true
  };

  return Licence
    .forge({ licenceId, includeInSupplementaryBilling: from })
    .save({ includeInSupplementaryBilling: to }, options);
};

/**
 * For all licences associated with a batch update the
 * include_in_supplementary_billing value to a new value where the current
 * value is equal to the 'from' parameter value.
 *
 * @param {String} batchId
 * @param {String} from The status value to move from (enum water.include_in_supplementary_billing)
 * @param {String} to The status value to move to (enum water.include_in_supplementary_billing)
 */
const updateIncludeInSupplementaryBillingStatusForBatch = (batchId, from, to) => {
  const params = { batchId, from, to };

  return bookshelf
    .knex
    .raw(queries.updateIncludeInSupplementaryBillingStatusForBatch, params);
};

exports.findByBatchIdForTwoPartTariffReview = findByBatchIdForTwoPartTariffReview;
exports.findByLicenceRef = findByLicenceRef;
exports.findOne = findOne;

exports.update = update;
exports.updateIncludeLicenceInSupplementaryBilling = updateIncludeLicenceInSupplementaryBilling;
exports.updateIncludeInSupplementaryBillingStatusForBatch = updateIncludeInSupplementaryBillingStatusForBatch;
