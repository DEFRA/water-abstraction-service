const billingVolumeService = require('../../services/billing-volumes-service');
const chargeVersionYearService = require('../../services/charge-version-year');
const batchService = require('../../services/batch-service');
const { BATCH_STATUS } = require('../../../../lib/models/batch');

process.on('message', async chargeVersionYearId => {
  try {
    // Load charge version year
    const chargeVersionYear = await chargeVersionYearService.getChargeVersionYearById(chargeVersionYearId);
    // Process charge version year
    const batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

    // Persist data
    await batchService.saveInvoicesToDB(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYearId);

    // Check how many records left to process
    const { processing, ready, error } = await chargeVersionYearService.getStatusCounts(batch.id);
    if (processing === 0) {
      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0 && batch.status === BATCH_STATUS.processing) {
        const updatedBatch = await batchService.setStatus(batch.id, BATCH_STATUS.review);
        return { processing, batch: updatedBatch };
      }
    }

    // When all charge version years are processed, add next job
    process.send(`Processing Charge Version Years: ${ready / (processing + error + ready)}%`);
    if (processing === 0 && (batch.status === BATCH_STATUS.processing)) {
      process.send({ complete: true, batchId: batch.id });
    }
  } catch (e) {
    process.send({ error: e });
  }
});
