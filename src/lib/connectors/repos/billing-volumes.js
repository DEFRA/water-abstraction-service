const { BillingVolume } = require('../bookshelf');

/**
 * Create a new billing volume
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingVolume
    .forge(data)
    .save();
  return model.toJSON();
};

/**
 * Gets billing volumes for charge elements and financial year
 * @param {Array<String>} ids - guids
 */
const findByChargeElementIdsAndFinancialYear = async (ids, financialYear) => {
  const result = await BillingVolume
    .forge()
    .query('whereIn', 'charge_element_id', ids)
    .where({ financial_year: financialYear })
    .fetchAll();

  return result.toJSON();
};

/**
 * Updates the record with the fields contained within changes object
 * @param {String} billingVolumeId
 * @param {Object} changes
 */
const update = async (billingVolumeId, changes) => {
  const result = await BillingVolume.forge({ billingVolumeId }).save(changes);
  return result.toJSON();
};

/**
 * Gets billing volumes for a given batchId where the isApproved flag = flase
 * @param {String} batchId
 */
const getUnapprovedVolumesForBatch = async batchId => {
  const result = await BillingVolume
    .forge()
    .where({ billing_batch_id: batchId, is_approved: false })
    .fetchAll();

  return result.toJSON();
};

exports.create = create;
exports.findByChargeElementIdsAndFinancialYear = findByChargeElementIdsAndFinancialYear;
exports.update = update;
exports.getUnapprovedVolumesForBatch = getUnapprovedVolumesForBatch;
