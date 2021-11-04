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

const findOneById = id => helpers.findOne(ChargeCategory, 'chargeCategoryId', id);

exports.create = create;
exports.updateByReference = updateByReference;
exports.updateById = updateById;
exports.findAll = findAll;
exports.findOneByReference = findOneByReference;
exports.findOneById = findOneById;
