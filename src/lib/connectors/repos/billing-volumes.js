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
 * Gets billing volumes for charge elements
 * @param {Array<String>} ids - guids
 */
const find = async ids => {
  const result = await BillingVolume
    .collection()
    .where('charge_element_id', 'in', ids)
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
exports.find = find;
exports.update = update;
