'use strict';

const { SupportedSource } = require('../bookshelf');

const helpers = require('./lib/helpers');

const create = data => helpers.create(SupportedSource, data);

const updateByReference = async (reference, changes) => {
  const result = await SupportedSource
    .where('reference', reference)
    .save(changes, { method: 'update', require: false });
  return result.toJSON();
};

const updateById = async (id, changes) => {
  const result = await SupportedSource
    .where('supported_source_id', id)
    .save(changes, { method: 'update', require: false });
  return result.toJSON();
};

const findAll = () => helpers.findMany(SupportedSource);

const findOneByReference = async reference => {
  const model = await SupportedSource
    .forge()
    .where('reference', '=', reference)
    .fetch({ require: false });

  return model && model.toJSON();
};

const findOneById = id => helpers.findOne(SupportedSource, 'supportedSourceId', id);

exports.create = create;
exports.updateByReference = updateByReference;
exports.updateById = updateById;
exports.findAll = findAll;
exports.findOneByReference = findOneByReference;
exports.findOneById = findOneById;
