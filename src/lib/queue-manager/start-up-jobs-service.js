'use strict'

// Config
const config = require('../../../config.js')

// Batch Notifications
const checkStatus = require('../../modules/batch-notifications/lib/jobs/check-status')
const refreshEvent = require('../../modules/batch-notifications/lib/jobs/refresh-event')
const sendMessage = require('../../modules/batch-notifications/lib/jobs/send-message')

// Billing
const customerFileRefresh = require('../../modules/billing//jobs/customer-file-refresh')

// Gauging Stations
const syncGaugingStations = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const syncLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const syncLicenceVersionPurposeConditionsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')

class StartUpJobsService {
  static go (queueManager) {
    this._batchNotificationsJobs(queueManager)

    this._billingJobs(queueManager)
    this._gaugingStationJobs(queueManager)
  }

  static async _batchNotificationsJobs (queueManager) {
    if (config.featureToggles.batchNotificationsJob) {
      queueManager.add(checkStatus.jobName)
    }
    queueManager.add(refreshEvent.jobName)
    queueManager.add(sendMessage.jobName)
  }

  static async _billingJobs (queueManager) {
    queueManager.add(customerFileRefresh.jobName)
  }

  static async _gaugingStationJobs (queueManager) {
    queueManager.add(syncGaugingStations.jobName)
    queueManager.add(syncLicenceGaugingStationsFromDigitise.jobName)
    queueManager.add(syncLicenceVersionPurposeConditionsFromDigitise.jobName)
  }
}

module.exports = { StartUpJobsService }
