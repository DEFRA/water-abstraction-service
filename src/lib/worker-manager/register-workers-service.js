'use strict'

const billingApproveBatch = require('../../modules/billing/jobs/approve-batch')
const billingChargeCategoriesSyncFromCsv = require('../../modules/billing/jobs/sync-charge-categories')
const billingCreateBillRun = require('../../modules/billing/jobs/create-bill-run')
const billingCreateCharge = require('../../modules/billing/jobs/create-charge')
const billingCustomerFileRefresh = require('../../modules/billing/jobs/customer-file-refresh')
const billingDeleteErroredBatch = require('../../modules/billing/jobs/delete-errored-batch')
const billingFindUpdateInvoiceAccounts = require('../../modules/billing/jobs/check-for-updated-invoice-accounts')
const billingPopulateBatchChargeVersions = require('../../modules/billing/jobs/populate-batch-charge-versions')
const billingPrepareTransactions = require('../../modules/billing/jobs/prepare-transactions')
const billingProcessChargeVersions = require('../../modules/billing/jobs/process-charge-versions')
const billingProcessChargeVersionYear = require('../../modules/billing/jobs/process-charge-version-year')
const billingRebilling = require('../../modules/billing/jobs/rebilling')
const billingRefreshTotals = require('../../modules/billing/jobs/refresh-totals')
const billingSupportedSourcesSyncFromCsv = require('../../modules/billing/jobs/sync-supported-sources')
const billingTwoPartTariffMatching = require('../../modules/billing/jobs/two-part-tariff-matching')
const billingUpdateCustomerAccount = require('../../modules/billing/jobs/update-customer')
const billingUpdateInvoices = require('../../modules/billing/jobs/update-invoices')
const chargeInformationUploadStart = require('../../modules/charge-versions-upload/jobs/update-charge-information-start')
const chargeInformationUploadToJson = require('../../modules/charge-versions-upload/jobs/update-charge-information-to-json')
const gaugingStationsCopyLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const gaugingStationsCopyLvpcFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')
const gaugingStationsSyncFromCsv = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const newLicenceVersion = require('../../modules/charge-versions/jobs/create-charge-version-workflows')
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
const valudateUploadedReturnsData = require('../../modules/returns/lib/jobs/validate-returns')

class RegisterWorkersService {
  static go (workerManager, queueManager) {
    this._jobs().forEach(job => {
      workerManager.register(job, queueManager)
    })
  }

  static _jobs () {
    return [
      billingApproveBatch,
      billingChargeCategoriesSyncFromCsv,
      billingCreateBillRun,
      billingCreateCharge,
      billingCustomerFileRefresh,
      billingDeleteErroredBatch,
      billingFindUpdateInvoiceAccounts,
      billingPopulateBatchChargeVersions,
      billingPrepareTransactions,
      billingProcessChargeVersions,
      billingProcessChargeVersionYear,
      billingRebilling,
      billingRefreshTotals,
      billingSupportedSourcesSyncFromCsv,
      billingTwoPartTariffMatching,
      billingUpdateCustomerAccount,
      billingUpdateInvoices,
      chargeInformationUploadStart,
      chargeInformationUploadToJson,
      gaugingStationsCopyLicenceGaugingStationsFromDigitise,
      gaugingStationsCopyLvpcFromDigitise,
      gaugingStationsSyncFromCsv,
      newLicenceVersion,
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
      valudateUploadedReturnsData
    ]
  }
}

module.exports = {
  RegisterWorkersService
}
