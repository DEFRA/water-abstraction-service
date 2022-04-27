
const chargeCategoryService = require('../../../../lib/services/charge-category');
const { parseBool } = require('../helpers');

const mapToChargeCategory = async data => {
  const source = parseBool(data.chargeReferenceDetailsSource) ? 'tidal' : 'non-tidal';
  const lossFactor = data.chargeReferenceDetailsLoss;
  const volume = parseFloat(data.chargeReferenceDetailsVolume);
  const isRestrictedSource = parseBool(data.chargeReferenceDetailsWaterAvailability);
  const modelTier = data.chargeReferenceDetailsModelling;
  const chargeCategory = await chargeCategoryService.findChargeCategoryByProperties(source, lossFactor, volume, isRestrictedSource, modelTier);
  return {
    id: chargeCategory.billingChargeCategoryId,
    reference: chargeCategory.reference,
    shortDescription: chargeCategory.shortDescription
  };
};

exports.mapToChargeCategory = mapToChargeCategory;
