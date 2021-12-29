'use strict';

const service = require('../../lib/services/charge-category');
const Boom = require('@hapi/boom');

/**
 * Get all change reasons
 */
const getChargeCategoryByProperties = async request => {
  const { source, loss, volume, waterAvailability, waterModel: modelTier } = request.query;
  const chargeCategory = await service.findChargeCategoryByProperties(source, loss, volume, waterAvailability, modelTier);
  // Find licence or 404
  if (!chargeCategory) {
    return Boom.notFound(
      `Charge category with source: ${source}, loss: ${loss}, volume: ${volume}, waterAvailablity: ${waterAvailability} and water model: ${modelTier} not found`);
  }
  return chargeCategory;
};

exports.getChargeCategoryByProperties = getChargeCategoryByProperties;
