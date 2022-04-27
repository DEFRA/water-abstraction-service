'use strict';

const { ChangeReason } = require('../bookshelf');

/**
 * Find all change reasons
 * @return {Promise<Array>}
 */
const find = async () => {
  const result = await ChangeReason
    .collection()
    .orderBy('description')
    .fetch();
  return result.toJSON();
};

const findOneByDescription = async description => {
  const model = await ChangeReason
    .forge()
    .where('description', '=', description)
    .fetch({ require: false });

  return model && model.toJSON();
};

exports.find = find;
exports.findOneByDescription = findOneByDescription;
