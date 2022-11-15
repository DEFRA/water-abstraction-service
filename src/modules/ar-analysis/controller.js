const Boom = require('@hapi/boom')
const updateLicence = require('./lib/update-licence-row')
const cron = require('node-cron')
const { logger } = require('../../logger')

/**
 * Run task nightly at 2am to refresh all data
 * 0 2 * * *
 *
 * https://crontab.guru/#0_2_*_*_*
 */
cron.schedule('0 2 * * *', () => {
  logger.info('Starting AR licence refresh')
  updateLicence.updateAllLicences()
})

/**
 * A webhook that updates the AR licence analysis table stored in the water service
 */
const getUpdateLicence = async (request, h) => {
  const { licenceRef } = request.params

  try {
    const result = await updateLicence.updateLicenceRow(licenceRef)
    return result
  } catch (error) {
    logger.error('Failed to update AR licence', error.stack, { licenceRef })
    throw Boom.badImplementation(`Unable to update AR licence analysis row for ${licenceRef}`)
  }
}

module.exports = {
  getUpdateLicence
}
