const { parseBool } = require('../helpers');
const helpers = require('../helpers');

const getSupportedSource = async name => {
  const supportedSources = await helpers.getSupportedSources();
  return supportedSources ? supportedSources.find(supportedSource => supportedSource.name === name) : null;
};

const getAdditionalCharges = async data => {
  const hasSupportedSourceCharge = parseBool(data.chargeReferenceDetailsSupportedSourceCharge);
  const isSupplyPublicWater = parseBool(data.chargeReferenceDetailsPublicWaterSupply);
  if (hasSupportedSourceCharge || isSupplyPublicWater) {
    const additionalCharges = { isSupplyPublicWater };
    if (hasSupportedSourceCharge) {
      const { billingSupportedSourceId: id, name } = await getSupportedSource(data.chargeReferenceDetailsSupportedSourceName);
      if (id) {
        additionalCharges.supportedSource = { id, name };
      }
    }
    return additionalCharges;
  } else {
    return null;
  }
};

exports.mapToAdditionalCharges = getAdditionalCharges;
