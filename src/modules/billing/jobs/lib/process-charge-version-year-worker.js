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
    // for SROC the invoice, invoice licences and transactions are raw pojo's i.e. not mapped
    await batchService.saveInvoicesToDB(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYearId);

    // Check how many records left to process
    const { processing, ready, error } = await chargeVersionYearService.getStatusCounts(batch.id);
    if (processing === 0) {
      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0 && batch.status === BATCH_STATUS.processing) {
        batch.status !== 'cancel' && await batchService.setStatus(batch.id, BATCH_STATUS.review);
      }
    }

    // When all charge version years are processed, add next job
    const progress = (ready / (processing + error + ready)) * 100;
    if (new Date().getSeconds() === 0 || new Date().getSeconds() === 30) {
      process.send(`Processing Charge Version Years: ${progress.toFixed(2)}%`);
    }

    if (processing === 0 && (batch.status === BATCH_STATUS.processing)) {
      process.send({ complete: true, batchId: batch.id });
    }

    // Indicate to the parent process that the job line is complete.
    return process.send({ jobComplete: true });
  } catch (e) {
    process.send({ error: e });
  }
});

const dat = {
  chargeElementId: "4993d5a8-6cef-4d8d-aba6-b5d119a5dc2b",
  startDate: "2022-04-01",
  endDate: "2023-03-31",
  loss: "medium",
  chargeType: "standard",
  authorisedQuantity: undefined,
  authorisedDays: 214,
  billableDays: 214,
  status: "candidate",
  description: "test category ref",
  volume: 0,
  section126Factor: "0.5",
  section127Agreement: true,
  section130Agreement: true,
  isWinterOnly: true,
  scheme: "sroc",
  aggregateProportion: "0.5",
  chargeCategoryCode: "4.5.17",
  chargeCategoryDescription: "Medium loss, non-tidal, restricted water, greater than 83 up to and including 142 ML/yr, Tier 1 model",
  isSupportedSource: true,
  supportedSourceName: undefined,
  isWaterCompanyCharge: true,
  isTwoPartSecondPartCharge: false,
  isCompensationCharge: false,
  isNewLicence: true,
  billingInvoiceLicenceId: "2e0b4813-4e32-4042-b4b9-97cc77370209",
}