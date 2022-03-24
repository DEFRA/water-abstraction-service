'use strict';

const { PurposeUse } = require('../bookshelf');
const helpers = require('./lib/helpers');

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

exports.findOneByLegacyId = id => helpers.findOne(PurposeUse, 'legacyId', id);
exports.create = data => helpers.create(PurposeUse, data);
exports.findAll = () => helpers.findMany(PurposeUse);
exports.findByCodes = findByCodes;
