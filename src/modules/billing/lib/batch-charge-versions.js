const { batchStatus } = require('./batch');

/**
 * Create an object ready for saving to the
 * water.billng_batch_charge_version_years table that contains the
 * batch, charge version and financial year values for future processing.
 *
 * @param {Object} billingBatchChargeVersion Object representing the inclusion of a charge version in a batch
 * @param {Number} financialYear The financial year value
 */
const createChargeVersionYear = (billingBatchChargeVersion, financialYear) => ({
  charge_version_id: billingBatchChargeVersion.charge_version_id,
  billing_batch_id: billingBatchChargeVersion.billing_batch_id,
  financial_year: financialYear,
  status: batchStatus.processing
});

exports.createChargeVersionYear = createChargeVersionYear;
