const billingVolumesRepo = require('../../../lib/connectors/repos/billing-volumes');
const mappers = require('../mappers');
const twoPartTariffMatching = require('./two-part-tariff-service');
const { NotFoundError } = require('../../../lib/errors');
const { BillingVolumeStatusError } = require('../lib/errors');

const isSummerChargeElement = chargeElement => chargeElement.season === 'summer';

const volumesToModels = volumes => volumes.map(mappers.billingVolume.dbToModel);

/**
 * Filter charge elements for matching season
 * Call repo to retrieve billing volumes for charge elements and financial year
 */
const getVolumesForChargeElements = async (chargeElements, financialYear) => {
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
  throw new NotFoundError(`Billing volumes missing for charge elements ${chargeElementIds}`);
};

/**
 * Calls two part tariff matching algorithm
 * @return {Object} matching results mapped to db
 */
const calculateVolumesForChargeElements = async (chargeElements, licenceNumber, financialYear, isSummer, batch) => {
  const matchingResults = await twoPartTariffMatching.calculateVolumes(chargeElements, licenceNumber, financialYear, isSummer);
  return mappers.billingVolume.matchingResultsToDb(matchingResults, financialYear, isSummer, batch.id);
};

/**
 * Create a new record for calculated billing volume
 * @return {BillingVolume}
 */
const persistBillingVolumesData = async (data) => Promise.all(
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
const getVolumes = async (chargeElements, licenceNumber, financialYear, isSummer, batch) => {
  const volumes = await getVolumesForChargeElements(chargeElements, financialYear);
  if (volumes) return volumes;

  const billingVolumesData = await calculateVolumesForChargeElements(chargeElements, licenceNumber, financialYear, isSummer, batch);
  return persistBillingVolumesData(billingVolumesData);
};

/**
 * Find billing volume for given chargeElementId, financialYear and isSummer flag
 *
 * throws error if billingVolume is not found
 * @param {String} chargeElementId
 * @param {Integer} financialYear
 * @param {Boolean} isSummer
 */
const getVolumeForChargeElement = async (chargeElementId, financialYear, isSummer) => {
  const result = await billingVolumesRepo.findByChargeElementIdsAndFinancialYear([chargeElementId], financialYear);
  return result.find(volume => volume.isSummer === isSummer);
};

const assertBillingVolumeIsNotApproved = billingVolume => {
  if (billingVolume.isApproved) throw new BillingVolumeStatusError('Approved billing volumes cannot be edited');
};
/**
 * Validates that the billingVolume has not been approved yet and
 * updates billingVolume with volume, updated twoPartTariffError to false
 * and stores user data
 *
 * @param {String} chargeElementId
 * @param {Batch} batch containing endYear and isSummer
 * @param {Number} volume
 * @param {Object} user containing id and email
 */
const updateBillingVolume = async (chargeElementId, batch, volume, user) => {
  const { endYear: { yearEnding }, isSummer } = batch;
  const billingVolume = await getVolumeForChargeElement(chargeElementId, yearEnding, isSummer);
  if (!billingVolume) throw new NotFoundError(`Billing volume not found for chargeElementId ${chargeElementId}, financialYear ${yearEnding} and isSummer ${isSummer}`);

  // validate that transaction is allowed to be altered
  assertBillingVolumeIsNotApproved(billingVolume);

  const changes = {
    volume,
    twoPartTariffError: false,
    twoPartTariffReview: { id: user.id, email: user.email }
  };
  const updatedBillingVolume = await billingVolumesRepo.update(billingVolume.billingVolumeId, changes);
  return mappers.billingVolume.dbToModel(updatedBillingVolume);
};

/**
 * Calls the repo to get the number of billingVolumes for the batch
 * with the isApproved flag set to false
 * @param {Batch} batch
 */
const getUnapprovedVolumesForBatchCount = async batch => {
  const result = await billingVolumesRepo.getUnapprovedVolumesForBatch(batch.id);
  return result.length;
};

const getVolumesForBatch = async batch => billingVolumesRepo.findByBatchId(batch.id);

const getVolumesWithTwoPartError = async batch => {
  const billingVolumes = await getVolumesForBatch(batch);
  return billingVolumes.filter(billingVolume => billingVolume.twoPartTariffError);
};

const approveVolumesForBatch = async batch => {
  const billingVolumes = await billingVolumesRepo.getUnapprovedVolumesForBatch(batch.id);
  for (const row of billingVolumes) {
    await billingVolumesRepo.update(row.billingVolumeId, { isApproved: true });
  }
};

exports.getVolumes = getVolumes;
exports.updateBillingVolume = updateBillingVolume;
exports.isSummerChargeElement = isSummerChargeElement;
exports.getUnapprovedVolumesForBatchCount = getUnapprovedVolumesForBatchCount;
exports.getVolumesForBatch = getVolumesForBatch;
exports.getVolumesWithTwoPartError = getVolumesWithTwoPartError;
exports.approveVolumesForBatch = approveVolumesForBatch;
