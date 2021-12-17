'use strict';

const service = require('../../lib/services/charge-category');

/**
 * Get all change reasons
 */
const getChargeCategoryByDescription = async (request, h) => {
  const { source, loss, volume, availability, model } = request.query;
  const chargeCategory = await service.findChargeCategoryByDescription(source, loss, volume, availability, model);
  return chargeCategory;
};

exports.getChargeCategoryByDescription = getChargeCategoryByDescription;
