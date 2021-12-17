'use strict';

const { ChargeCategory } = require('../bookshelf');

const helpers = require('./lib/helpers');

const create = data => helpers.create(ChargeCategory, data);

const updateByReference = async (reference, changes) => {
  const result = await ChargeCategory
    .where('reference', reference)
    .save(changes, { method: 'update', require: false });
  return result.toJSON();
};

const updateById = async (id, changes) => {
  const result = await ChargeCategory
    .where('charge_category_id', id)
    .save(changes, { method: 'update', require: false });
  return result.toJSON();
};

const findAll = () => helpers.findMany(ChargeCategory);

const findOneByReference = async reference => {
  const model = await ChargeCategory
    .forge()
    .where('reference', '=', reference)
    .fetch({ require: false });

  return model && model.toJSON();
};

const findOneByProperties = async (isTidal, lossFactor, restrictedSource, modelTier, volume) => {
  const result = await ChargeCategory
    .forge()
    .where({ is_tidal: isTidal, loss_factor: lossFactor, model_tier: modelTier, restricted_source: restrictedSource })
    .where('min_volume', '<', volume)
    .where('max_volume', '>=', volume)
    .fetch({ require: false });

  return result.toJSON();
};

const findOneById = id => helpers.findOne(ChargeCategory, 'chargeCategoryId', id);

exports.create = create;
exports.updateByReference = updateByReference;
exports.updateById = updateById;
exports.findAll = findAll;
exports.findOneByReference = findOneByReference;
exports.findOneById = findOneById;
exports.findOneByProperties = findOneByProperties;
