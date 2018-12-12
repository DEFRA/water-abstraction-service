const Boom = require('boom');
const { updateLicenceRow, updateAllLicences } = require('./lib/update-licence-row');
const cron = require('node-cron');
const logger = require('../../lib/logger');

/**
 * Run task nightly at 2am to refresh all data
 * 0 2 * * *
 */
cron.schedule('0 * * * *', () => {
  logger.info(`Starting AR licence refresh`);
  updateAllLicences();
});

/**
 * A webhook that updates the AR licence analysis table stored in the water service
 */
const getUpdateLicence = async (request, h) => {
  const { licenceRef } = request.params;

  const result = await updateLicenceRow(licenceRef);

  if (result) {
    return result;
  }
  throw Boom.badImplementation(`Unable to update AR licence analysis row for ${licenceRef}`);
};

module.exports = {
  getUpdateLicence
};
