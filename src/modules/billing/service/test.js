const service = require('./');
const logger = require('../../../logger');

// To-do:
// Load charge version
// Load licence docs versions from API
// Loop through and create invoices
const initialiseFromChargeVersionYear = async chargeVersionYear => {
  const {
    charge_version_id: chargeVersionId,
    financial_year_ending: financialYearEnding
  } = chargeVersionYear;

  // Process charge data
  const { error, data } = await service.chargeProcessor(financialYearEnding, chargeVersionId);

  if (error) {
    const msg = 'Error processing charge version year';
    logger.error(msg, chargeVersionYear);
    throw new Error(msg);
  }

  // Create batch
  const batch = service.chargeProcessor.modelMapper(chargeVersionYear.billing_batch_id, data);

  console.log(JSON.stringify(batch, null, 2));
};

initialiseFromChargeVersionYear({
  billing_batch_charge_version_year_id: '944dc076-a034-4845-991e-28f64fe1f8c4',
  billing_batch_id: '7b844a49-b11e-431c-910a-c188995c989d',
  charge_version_id: '980293d0-c0fe-4a77-b676-141d4c085eda',
  financial_year_ending: 2018,
  status: 'processing'
});
