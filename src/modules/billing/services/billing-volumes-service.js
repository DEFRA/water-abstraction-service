const billingVolumesRepo = require('../../../lib/connectors/repos/billing-volumes');
const mappers = require('../mappers');
const twoPartTariffMatching = require('./two-part-tariff-service');
const { isEmpty, flatMap } = require('lodash');

const chargeElementSeasonMatches = (chargeElement, isSummer) => {
  const chargeElementIsSummer = chargeElement.season === 'summer';
  return chargeElementIsSummer === isSummer;
};

const getChargeElementIds = (chargeVersion, isSummer) => {
  return chargeVersion.chargeElements.filter(chargeElement => {
    if (chargeElementSeasonMatches(chargeElement, isSummer)) {
      return chargeElement.chargeElementId;
    };
  });
};

const billingVolumeToModel = volume => mappers.billingVolume.dbToModel(volume);

const volumesToModels = volumes => volumes.map(billingVolumeToModel);

const isMissingVolumes = volumes => {
  const containsNull = volumes.map(volume => isEmpty(volume));
  return containsNull.includes(true);
};

const getVolumesForChargeElements = async (chargeVersion, financialYear, isSummer) => {
  const chargeElements = getChargeElementIds(chargeVersion, isSummer);
  const billingVolumes = await Promise.all(
    chargeElements.map(async chargeElement => {
      return billingVolumesRepo.findByChargeElementId(chargeElement.chargeElementId);
    }));
  if (isMissingVolumes(billingVolumes)) return null;

  const relevantVolumes = flatMap(billingVolumes).filter(volume => volume.financialYear === financialYear && volume.isSummer === isSummer);
  return volumesToModels(relevantVolumes);
};

const mapMatchingResultsToBillingVolumeStructure = (matchingResults, financialYear, isSummer) => {
  const { error: overallError } = matchingResults;
  return matchingResults.data.map(result => {
    const twoPartTariffStatus = overallError || result.error;
    return {
      chargeElementId: result.data.chargeElementId,
      financialYear,
      isSummer,
      calculatedVolume: result.data.actualReturnQuantity,
      twoPartTariffStatus: twoPartTariffStatus,
      twoPartTariffError: !!twoPartTariffStatus,
      isApproved: false
    };
  });
};

const persistBillingVolumesData = async data => Promise.all(
  data.map(async row => {
    const result = await billingVolumesRepo.create(row);
    return billingVolumeToModel(result);
  }));

const calculateVolumesForChargeElements = async (chargeVersion, financialYear, isSummer) => {
  // @TODO: Update TPT service interface to match function call
  const matchingResults = await twoPartTariffMatching.calculateVolumes(chargeVersion, financialYear, isSummer);
  return mapMatchingResultsToBillingVolumeStructure(matchingResults, financialYear, isSummer);
};

/**
 * Get billing volumes from the DB or by calling the returns matching algorithm
 * @param {Object} chargeVersion containing licenceRef and chargeElements
 * @param {Integer} financialYear
 * @param {Boolean} isSummer
 */
const getVolumes = async (chargeVersion, financialYear, isSummer) => {
  const volumes = await getVolumesForChargeElements(chargeVersion, financialYear, isSummer);
  if (volumes) return volumes;

  const billingVolumesData = await calculateVolumesForChargeElements(chargeVersion, financialYear, isSummer);
  return persistBillingVolumesData(billingVolumesData);
};

exports.getVolumes = getVolumes;
