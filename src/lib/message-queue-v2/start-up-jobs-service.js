'use strict'

const cron = require('node-cron')

// Batch Notifications
const checkStatus = require('../../modules/batch-notifications/lib/jobs/check-status')
const refreshEvent = require('../../modules/batch-notifications/lib/jobs/refresh-event')
const sendMessage = require('../../modules/batch-notifications/lib/jobs/send-message')

// Billing
const customerFileRefresh = require('../../modules/billing//jobs/customer-file-refresh')
const syncChargeCategories = require('../../modules/billing/jobs/sync-charge-categories')
const syncSupportedSources = require('../../modules/billing/jobs/sync-supported-sources')

// Charge versions
const { publishJobs } = require('../../modules/charge-versions/plugin')

// Gauging Stations
const syncGaugingStations = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const syncLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const syncLicenceVersionPurposeConditionsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')

class StartUpJobsService {
  static go (queueManager) {
    this._batchNotificationsJobs(queueManager)
    this._billingJobs(queueManager)
    this._chargeVersionsJobs(queueManager)
    this._gaugingStationJobs(queueManager)
  }

  static async _batchNotificationsJobs (queueManager) {
    queueManager.add(checkStatus.jobName)

    queueManager.add(refreshEvent.jobName)
    queueManager.add(sendMessage.jobName)
  }

  static async _billingJobs (queueManager) {
    await queueManager.deleteKeysByPattern('*billing.customer-file-refresh*')
    queueManager.add(customerFileRefresh.jobName)

    queueManager.add(syncChargeCategories.jobName)
    queueManager.add(syncSupportedSources.jobName)
  }

  static async _chargeVersionsJobs (queueManager) {
    cron.schedule('0 */6 * * *', () => publishJobs(queueManager))
  }

  static async _gaugingStationJobs (queueManager) {
    queueManager.add(syncGaugingStations.jobName)
    queueManager.add(syncLicenceGaugingStationsFromDigitise.jobName)
    queueManager.add(syncLicenceVersionPurposeConditionsFromDigitise.jobName)
  }
}

module.exports = { StartUpJobsService }
