'use strict';
const repo = require('../connectors/repos/charge-categories');
/**
 *
 * @param {Array} filter array of string values to filter by
 * @returns {ChargeCategory}
 */
const findChargeCategoryByProperties = async (source, lossFactor, volume, waterAvailability, modelTier) => {
  const isTidal = source === 'tidal';
  const restrictedSource = isTidal ? false : waterAvailability !== 'available';
  return repo.findOneByProperties(isTidal, lossFactor, restrictedSource, modelTier, volume);
};

module.exports.findChargeCategoryByProperties = findChargeCategoryByProperties;
