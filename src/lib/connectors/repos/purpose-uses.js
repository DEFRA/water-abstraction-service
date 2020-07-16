'use strict';

const { PurposeUse } = require('../bookshelf');

/**
 * Gets a list of purpose uses by the supplied legacy NALD use codes
 * @param {Array<String>} codes
 * @return {Promise<Array>}
 */
const findByCodes = async codes => {
  const collection = await PurposeUse
    .where('legacy_id', 'in', codes)
    .fetchAll();
  return collection ? collection.toJSON() : null;
};

exports.findByCodes = findByCodes;
