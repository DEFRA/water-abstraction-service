const billingVolumesRepo = require('../../../lib/connectors/repos/billing-volumes');
const mappers = require('../mappers');
const twoPartTariffMatching = require('./two-part-tariff-service');
const { NotFoundError } = require('../../../lib/errors');

const isSummerChargeElement = chargeElement => chargeElement.season === 'summer';

const getChargeElementsForSeason = (chargeVersion, isSummer) =>
  chargeVersion.chargeElements.filter(chargeElement => isSummerChargeElement(chargeElement) === isSummer);

const volumesToModels = volumes => volumes.map(mappers.billingVolume.dbToModel);

/**
 * Filter charge elements for matching season
 * Call repo to retrieve billing volumes for charge elements and financial year
 */
const getVolumesForChargeElements = async (chargeVersion, financialYear, isSummer) => {
  const chargeElements = getChargeElementsForSeason(chargeVersion, isSummer);
  const chargeElementIds = chargeElements.map(chargeElement => chargeElement.id);
  const billingVolumes = await billingVolumesRepo.findByChargeElementIdsAndFinancialYear(chargeElementIds, financialYear);

  // The matching process has never run - no billing volumes have been persisted
  if (billingVolumes.length === 0) {
    return null;
  }
  // There is an exact match - billing volumes already calculated and persisted
  if (chargeElements.length === billingVolumes.length) {
    return volumesToModels(billingVolumes);
  }
  // There is a mismatch - something has gone wrong
  throw new NotFoundError(`Billing volumes missing for charge version ${chargeVersion.id}`);
};

/**
 * Calls two part tariff matching algorithm
 * @return {Object} matching results mapped to db
 */
const calculateVolumesForChargeElements = async (chargeVersion, financialYear, isSummer) => {
  const matchingResults = await twoPartTariffMatching.calculateVolumes(chargeVersion, financialYear, isSummer);
  return mappers.billingVolume.matchingResultsToDb(matchingResults, financialYear, isSummer);
};

/**
 * Create a new record for calculated billing volume
 * @return {BillingVolume}
 */
const persistBillingVolumesData = async data => Promise.all(
  data.map(async row => {
    const result = await billingVolumesRepo.create(row);
    return mappers.billingVolume.dbToModel(result);
  }));

/**
 * Get billing volumes from the DB or by calling the returns matching algorithm
 * @param {ChargeVersion} chargeVersion containing licence and chargeElements
 * @param {Integer} financialYear
 * @param {Boolean} isSummer
 */
const getVolumes = async (chargeVersion, financialYear, isSummer) => {
  const volumes = await getVolumesForChargeElements(chargeVersion, financialYear, isSummer);
  if (volumes) return volumes;

  const billingVolumesData = await calculateVolumesForChargeElements(chargeVersion, financialYear, isSummer);
  return persistBillingVolumesData(billingVolumesData);
};

const updateBillingVolume = async () => {};

exports.getVolumes = getVolumes;
exports.updateBillingVolume = updateBillingVolume;
