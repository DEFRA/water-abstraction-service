const { parseBool } = require('../helpers');
const { SCHEME } = require('../../../../lib/models/constants');
const adjustmentsMapper = require('./adjustmentsMapper');
const additionalChargesMapper = require('./additionalChargesMapper');

const { sroc } = SCHEME;

const mapToChargeElement = async (data, licence, chargeCategory, chargePurposes) => {
  const source = parseBool(data.chargeReferenceDetailsSource) ? 'tidal' : 'non-tidal';
  return {
    source,
    chargeCategory,
    chargePurposes,
    eiucSource: source,
    loss: data.chargeReferenceDetailsLoss,
    description: data.chargeReferenceLineDescription,
    scheme: sroc,
    volume: parseFloat(data.chargeReferenceDetailsVolume),
    eiucRegion: licence.regionalChargeArea.name,
    waterModel: data.chargeReferenceDetailsModelling,
    additionalCharges: await additionalChargesMapper.mapToAdditionalCharges(data),
    isRestrictedSource: parseBool(data.chargeReferenceDetailsWaterAvailability),
    isSection127AgreementEnabled: parseBool(data.chargeReferenceDetailsTwoPartTariffAgreementApplies),
    adjustments: adjustmentsMapper.mapToAdjustments(data)
  };
};

exports.mapToChargeElement = mapToChargeElement;
