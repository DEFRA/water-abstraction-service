'use strict';

const repos = require('../connectors/repos');
const licenceMapper = require('../mappers/licence');
const licenceVersionMapper = require('../mappers/licence-version');
const { INCLUDE_IN_SUPPLEMENTARY_BILLING } = require('../models/constants');

/**
 * Gets a licence model by ID
 * @param {String} licenceId
 * @return {Promise<Licence>}
 */
const getLicenceById = async licenceId => {
  const data = await repos.licences.findOne(licenceId);
  return data && licenceMapper.dbToModel(data);
};

const getLicenceVersions = async licenceId => {
  const versions = await repos.licenceVersions.findByLicenceId(licenceId);
  return versions.map(licenceVersionMapper.dbToModel);
};

const getLicenceVersionById = async licenceVersionId => {
  const licenceVersion = await repos.licenceVersions.findOne(licenceVersionId);

  return licenceVersion && licenceVersionMapper.dbToModel(licenceVersion);
};

/**
 * Updates the includeInSupplementaryBilling value for the given licence ids
 *
 * @param {String} from The status to move from (yes, no, reprocess)
 * @param {String} to The status to move to (yes, no, reprocess)
 * @param  {...String} licenceIds One or many licences ids to update
 */
const updateIncludeInSupplementaryBillingStatus = async (from, to, ...licenceIds) => {
  for (const licenceId of licenceIds) {
    await repos.licences.updateIncludeLicenceInSupplementaryBilling(licenceId, from, to);
  }
};

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from reprocess to yes for situtations where the batch has not got
 * through the the sent phase. This allows the licences to be picked up
 * in a future supplementary bill run.
 *
 * @param {String} batchId
 */
const updateIncludeInSupplementaryBillingStatusForUnsentBatch = batchId => {
  return repos.licences.updateIncludeInSupplementaryBillingStatusForBatch(
    batchId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.reprocess,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes
  );
};

/**
 * Sets the water.licences.include_in_supplementary_billing value
 * from yes to no, then reprocess to yes for situtations where the batch has
 * been sent and therefore the licences don't need to be includes in
 * a future supplementary bill run.
 *
 * @param {String} batchId
 */
const updateIncludeInSupplementaryBillingStatusForSentBatch = async batchId => {
  await repos.licences.updateIncludeInSupplementaryBillingStatusForBatch(
    batchId,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.yes,
    INCLUDE_IN_SUPPLEMENTARY_BILLING.no
  );

  // use the unsent function to save writing the same logic twice, even though
  // the function name is a little misleading here.
  return updateIncludeInSupplementaryBillingStatusForUnsentBatch(batchId);
};

exports.getLicenceById = getLicenceById;
exports.getLicenceVersionById = getLicenceVersionById;
exports.getLicenceVersions = getLicenceVersions;

exports.updateIncludeInSupplementaryBillingStatus = updateIncludeInSupplementaryBillingStatus;
exports.updateIncludeInSupplementaryBillingStatusForUnsentBatch = updateIncludeInSupplementaryBillingStatusForUnsentBatch;
exports.updateIncludeInSupplementaryBillingStatusForSentBatch = updateIncludeInSupplementaryBillingStatusForSentBatch;
