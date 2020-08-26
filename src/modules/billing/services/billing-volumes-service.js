'use strict';

const billingVolumesRepo = require('../../../lib/connectors/repos/billing-volumes');
const mappers = require('../mappers');
const { NotFoundError } = require('../../../lib/errors');
const { BillingVolumeStatusError } = require('../lib/errors');

/**
 * Filter charge elements for matching season
 * Call repo to retrieve billing volumes for charge elements and financial year
 */
const getVolumesForChargeElements = async (chargeElements, financialYear) => {
  const chargeElementIds = chargeElements.map(chargeElement => chargeElement.id);
  const data = await billingVolumesRepo.findApprovedByChargeElementIdsAndFinancialYear(chargeElementIds, financialYear.endYear);
  return data.map(mappers.billingVolume.dbToModel);
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
const updateBillingVolume = async (billingVolumeId, volume, user) => {
  const billingVolume = await getBillingVolumeById(billingVolumeId);

  // validate that transaction is allowed to be altered
  assertBillingVolumeIsNotApproved(billingVolume);

  const changes = {
    volume,
    twoPartTariffError: false,
    twoPartTariffReview: { id: user.id, email: user.email }
  };

  const updatedBillingVolume = await billingVolumesRepo.update(billingVolume.id, changes);
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

/**
 * Throws error if there are billing volumes in the batch with two-part tariff error
 * @param {Batch} batch
 */
const assertNoBillingVolumesWithTwoPartError = async batch => {
  const billingVolumes = await getVolumesForBatch(batch);
  const isError = billingVolumes.some(
    billingVolume => billingVolume.twoPartTariffError
  );
  if (isError) {
    throw new BillingVolumeStatusError('Cannot approve review. There are outstanding two part tariff errors to resolve');
  }
};

/**
 * Updates all billing volumes in batch to be approved.
 * If any are billing volumes in the batch still containing a two-part tariff
 * error, then an error is thrown
 * @param {Batch} batch
 * @return {Promise}
 */
const approveVolumesForBatch = async batch => {
  await assertNoBillingVolumesWithTwoPartError(batch);
  return billingVolumesRepo.updateByBatchId(batch.id, { isApproved: true });
};

/**
 * Persists a single BillingVolume instance
 * @param {BillingVolume} billingVolume
 */
const persist = async billingVolume => {
  const dbRow = mappers.billingVolume.modelToDB(billingVolume);
  const data = await billingVolumesRepo.create(dbRow);
  return mappers.billingVolume.dbToModel(data);
};

/**
 * Gets a list of billing volumes for the specified batch and licence ID
 * @param {Batch} batch
 * @param {String} licenceId
 * @return {Promise<Array>}
 */
const getLicenceBillingVolumes = async (batch, licenceId) => {
  // First find billing volumes relating to licence
  const billingVolumes = await billingVolumesRepo.findByBatchIdAndLicenceId(batch.id, licenceId);
  const billingVolumeIds = billingVolumes.map(billingVolume => billingVolume.billingVolumeId);

  // Next, get full data structure for each billing volume from above
  // and map to service model shape
  const data = await billingVolumesRepo.findByIds(billingVolumeIds);
  return data.map(mappers.billingVolume.dbToModel);
};

/**
 * Gets a single billing volume by ID
 * If not found, an error is thrown
 * @param {String} billingVolumeId
 * @return {Promise<BillingVolume>}
 */
const getBillingVolumeById = async (billingVolumeId) => {
  const [data] = await billingVolumesRepo.findByIds([billingVolumeId]);
  if (!data) {
    throw new NotFoundError(`Billing volume ${billingVolumeId} not found`);
  }
  return mappers.billingVolume.dbToModel(data);
};

exports.updateBillingVolume = updateBillingVolume;
exports.getUnapprovedVolumesForBatchCount = getUnapprovedVolumesForBatchCount;
exports.getVolumesForBatch = getVolumesForBatch;
exports.approveVolumesForBatch = approveVolumesForBatch;
exports.persist = persist;
exports.getLicenceBillingVolumes = getLicenceBillingVolumes;
exports.getBillingVolumeById = getBillingVolumeById;
exports.getVolumesForChargeElements = getVolumesForChargeElements;
