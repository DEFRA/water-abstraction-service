'use strict';

const repos = require('../../../lib/connectors/repos');
const Batch = require('../../../lib/models/batch');
const { BatchStatusError } = require('../lib/errors');
const licencesService = require('../../../lib/services/licences');
const invoiceAccountService = require('../../../lib/services/invoice-accounts-service');
const bluebird = require('bluebird');

const mapItem = async (licence, invoiceAccountCompany) => ({
  licenceId: licence.licenceId,
  licenceRef: licence.licenceRef,
  twoPartTariffError: licence.twoPartTariffErrors.includes(true),
  twoPartTariffStatuses: Array.from(
    licence.twoPartTariffStatuses.reduce((statuses, status) => {
      return (status === null) ? statuses : statuses.add(status);
    }, new Set())
  ),
  billingContact: invoiceAccountCompany.name
});

/**
 * Gets a shape of data not defined by the service layer models that
 * represents the billing invoice licence records that exist in a
 * batch, including the aggregated two part tariff status codes for the
 * underlying transactions.
 * This shifts from the pattern of passing models around due to
 * the volume of data that would have to be serialized for annual batches.
 * Invoice Account Company added to display the billing contact in the UI
 *
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getByBatchIdForTwoPartTariffReview = async batchId => {
  const data = await repos.licences.findByBatchIdForTwoPartTariffReview(batchId);
  return bluebird.mapSeries(data, async row => {
    const invoiceAccount = await invoiceAccountService.getByInvoiceAccountId(row.invoiceAccountId);
    return mapItem(row, invoiceAccount.company);
  });
};

/**
 * Deletes a licence from the batch during TPT review stage
 * @param {Batch} batch
 * @param {String} licenceId
 */
const deleteBatchLicence = async (batch, licenceId) => {
  // Check batch is in review status
  if (!batch.statusIsOneOf(Batch.BATCH_STATUS.review)) {
    throw new BatchStatusError('Cannot delete licence unless batch is in "review" status');
  }
  await repos.billingVolumes.deleteByBatchIdAndLicenceId(batch.id, licenceId);
  await repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId(batch.id, licenceId);
  // flag for supplementary billing
  await licencesService.flagForSupplementaryBilling(licenceId);
};

exports.getByBatchIdForTwoPartTariffReview = getByBatchIdForTwoPartTariffReview;
exports.deleteBatchLicence = deleteBatchLicence;
