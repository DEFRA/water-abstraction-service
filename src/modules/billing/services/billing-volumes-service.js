const billingVolumesRepo = require('../../../lib/connectors/repos/billing-volumes');
const mappers = require('../mappers');
const twoPartTariffMatching = require('./two-part-tariff-service');
const { isEmpty } = require('lodash');

const getChargeElementIds = chargeVersion => chargeVersion.chargeElements.map(chargeElement => chargeElement.chargeElementId);

const billingVolumeToModel = volume => mappers.billingVolume.dbToModel(volume);

const volumesToModels = volumes => volumes.map(billingVolumeToModel);

const getVolumesForChargeElements = async (chargeVersion, financialYear, isSummer) => {
  const volumes = await billingVolumesRepo.find(getChargeElementIds(chargeVersion));
  const relevantVolumes = volumes.filter(volume => volume.financialYear === financialYear && volume.isSummer === isSummer);
  return isEmpty(relevantVolumes) ? null : volumesToModels(relevantVolumes);
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
