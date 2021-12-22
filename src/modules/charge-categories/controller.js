'use strict';

const service = require('../../lib/services/charge-category');
const Boom = require('@hapi/boom');

/**
 * Get all change reasons
 */
const getChargeCategoryByProperties = async (request) => {
  const { source, loss, volume, availability, model } = request.query;
  const chargeCategory = await service.findChargeCategoryByProperties(source, loss, volume, availability, model);
  // Find licence or 404
  if (!chargeCategory) {
    return Boom.notFound(
      `Charge category with source: ${source}, loss: ${loss}, volume: ${volume}, availablity: ${availability} and model: ${model} not found`);
  }
  return chargeCategory;
};

exports.getChargeCategoryByProperties = getChargeCategoryByProperties;
