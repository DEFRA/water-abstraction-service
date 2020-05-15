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
    .where('charge_element_id', 'in', ids)
    .andWhere({ financial_year: financialYear })
    .fetchAll();

  return result.toJSON();
};

/**
 * Updates the record with the fields contained within changes object
 * @param {String} id
 * @param {Object} changes
 */
const update = async (id, changes) => {
  const result = await BillingVolume.forge({ billingEventId: id }).save(changes);
  return result.toJSON();
};

exports.create = create;
exports.findByChargeElementIdsAndFinancialYear = findByChargeElementIdsAndFinancialYear;
exports.update = update;
