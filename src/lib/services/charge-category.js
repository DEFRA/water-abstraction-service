'use strict';
const repo = require('../connectors/repos/charge-categories');
/**
 *
 * @param {Array} filter array of string values to filter by
 * @returns {ChargeCategory}
 */
const findChargeCategoryByProperties = async (source, lossFactor, volume, isRestrictedSource, modelTier) => {
  const isTidal = source === 'tidal';
  // if the water source is Tidal the water availability is not restricted
  const isRestricted = isTidal ? false : isRestrictedSource;
  return repo.findOneByProperties(isTidal, lossFactor, isRestricted, modelTier, Math.ceil(volume));
};

module.exports.findChargeCategoryByProperties = findChargeCategoryByProperties;
