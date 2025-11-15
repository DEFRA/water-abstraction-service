'use strict'

// Batch Notifications
const checkStatus = require('../../modules/batch-notifications/lib/jobs/check-status')
const sendMessage = require('../../modules/batch-notifications/lib/jobs/send-message')

// Gauging Stations
const syncGaugingStations = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const syncLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const syncLicenceVersionPurposeConditionsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')

class StartUpJobsService {
  static go (queueManager) {
    this._batchNotificationsJobs(queueManager)
    this._gaugingStationJobs(queueManager)
  }

  static async _batchNotificationsJobs (queueManager) {
    queueManager.add(checkStatus.jobName)
    queueManager.add(sendMessage.jobName)
  }

  static async _gaugingStationJobs (queueManager) {
    queueManager.add(syncGaugingStations.jobName)
    queueManager.add(syncLicenceGaugingStationsFromDigitise.jobName)
    queueManager.add(syncLicenceVersionPurposeConditionsFromDigitise.jobName)
  }
}

module.exports = { StartUpJobsService }
