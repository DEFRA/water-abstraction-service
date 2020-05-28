const { ChangeReason } = require('../bookshelf');

/**
 * Find all change reasons
 * @return {Promise<Array>}
 */
const find = async () => {
  const result = await ChangeReason
    .collection()
    .orderBy('sort_order')
    .fetch();
  return result.toJSON();
};

exports.find = find;
