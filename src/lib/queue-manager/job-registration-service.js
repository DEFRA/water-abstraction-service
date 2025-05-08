'use strict'

const billingApproveBatch = require('../../modules/billing/jobs/approve-batch')
const billingCreateBillRun = require('../../modules/billing/jobs/create-bill-run')
const billingCreateCharge = require('../../modules/billing/jobs/create-charge')
const billingCustomerFileRefresh = require('../../modules/billing/jobs/customer-file-refresh')
const billingDeleteErroredBatch = require('../../modules/billing/jobs/delete-errored-batch')
const billingPopulateBatchChargeVersions = require('../../modules/billing/jobs/populate-batch-charge-versions')
const billingPrepareTransactions = require('../../modules/billing/jobs/prepare-transactions')
const billingProcessChargeVersions = require('../../modules/billing/jobs/process-charge-versions')
const billingProcessChargeVersionYear = require('../../modules/billing/jobs/process-charge-version-year')
const billingRebilling = require('../../modules/billing/jobs/rebilling')
const billingRefreshTotals = require('../../modules/billing/jobs/refresh-totals')
const billingTwoPartTariffMatching = require('../../modules/billing/jobs/two-part-tariff-matching')
const billingUpdateCustomerAccount = require('../../modules/billing/jobs/update-customer')
const billingUpdateInvoices = require('../../modules/billing/jobs/update-invoices')
const billingUpdateInvoiceReferences = require('../../modules/billing/jobs/update-invoice-references.js')
const chargeInformationUploadStart = require('../../modules/charge-versions-upload/jobs/update-charge-information-start')
const chargeInformationUploadToJson = require('../../modules/charge-versions-upload/jobs/update-charge-information-to-json')
const gaugingStationsCopyLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const gaugingStationsCopyLvpcFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')
const gaugingStationsSyncFromCsv = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const notificationsCheckStatus = require('../../modules/batch-notifications/lib/jobs/check-status')
const notificationsGetRecipients = require('../../modules/batch-notifications/lib/jobs/get-recipients')
const notificationsRefreshEvent = require('../../modules/batch-notifications/lib/jobs/refresh-event')
const notificationsSendMessage = require('../../modules/batch-notifications/lib/jobs/send-message')
const notifySend = require('../../modules/notify/lib/notify-send')
const persistBulkReturns = require('../../modules/returns/lib/jobs/persist-returns')
const returnsNotificationSend = require('../../modules/returns-notifications/lib/returns-notification-send')
const returnsUpload = require('../../modules/returns/lib/jobs/start-upload')
const returnsUploadToJson = require('../../modules/returns/lib/jobs/map-to-json')
const updateChargeInformationSave = require('../../modules/charge-versions-upload/jobs/update-charge-information-save')
const validateUploadedReturnsData = require('../../modules/returns/lib/jobs/validate-returns')

/**
 * Register all WRLS Jobs with the QueueManager
 *
 * This is used in the root `index*.js` files when starting up the app. Any jobs that need 'registering' with BullMQ
 * should be referenced and added here.
 *
 * Each of the imports is to a WRLS job file. All jobs are expected to have the following properties
 *
 * - `jobName` the name to use when referencing this job. Will be used to name the Queue
 * - `handler` the function the worker will call when it takes a 'job' off the queue
 * - `hasScheduler` whether the job needs a `QueueScheduler`. These are needed where a job is repeatable, scheduled
 *    with cron, or can be retried
 * - `onFailed` the function to call when the worker fires this event
 *
 * They may also have these optional properties
 *
 * - `startClean` when set to `true` we tell Redis to remove the existing queue before registering the new one
 * - `onComplete` the function to call when the worker fires this event
 * - `workerOptions` any additional options to pass to the worker when instantiated. Often these will be extensions
 *    to the lock timings i.e. how long a worker has to complete a job.
 *
 * They must also have a `createMessage()` method which is used when adding BullMQ jobs to a queue.
 */
class JobRegistrationService {
  /**
   * When called will register all WRLS jobs with BullMQ
   *
   * @param {QueueManager} queueManager An instance of `QueueManager`
   */
  static go (queueManager) {
    this._jobs().forEach(job => {
      queueManager.register(job)
    })
  }

  static _jobs () {
    return [
      billingApproveBatch,
      billingCreateBillRun,
      billingCreateCharge,
      billingCustomerFileRefresh,
      billingDeleteErroredBatch,
      billingPopulateBatchChargeVersions,
      billingPrepareTransactions,
      billingProcessChargeVersions,
      billingProcessChargeVersionYear,
      billingRebilling,
      billingRefreshTotals,
      billingTwoPartTariffMatching,
      billingUpdateCustomerAccount,
      billingUpdateInvoices,
      billingUpdateInvoiceReferences,
      chargeInformationUploadStart,
      chargeInformationUploadToJson,
      gaugingStationsCopyLicenceGaugingStationsFromDigitise,
      gaugingStationsCopyLvpcFromDigitise,
      gaugingStationsSyncFromCsv,
      notificationsCheckStatus,
      notificationsGetRecipients,
      notificationsRefreshEvent,
      notificationsSendMessage,
      notifySend,
      persistBulkReturns,
      returnsNotificationSend,
      returnsUpload,
      returnsUploadToJson,
      updateChargeInformationSave,
      validateUploadedReturnsData
    ]
  }
}

module.exports = {
  JobRegistrationService
}
