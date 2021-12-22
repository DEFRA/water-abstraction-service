'use strict';
const repo = require('../connectors/repos/charge-categories');
/**
 *
 * @param {Array} filter array of string values to filter by
 * @returns {ChargeCategory}
 */
const findChargeCategoryByDescription = async (source, lossFactor, volume, availability, modelTier) => {
  const isTidal = source === 'Tidal';
  const restrictedSource = isTidal ? false : availability !== 'Available';
  const result = await repo.findOneByProperties(isTidal, lossFactor, restrictedSource, modelTier, volume);
  return result;
};

module.exports.findChargeCategoryByDescription = findChargeCategoryByDescription;
