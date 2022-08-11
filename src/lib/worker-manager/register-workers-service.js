'use strict'

const returnsUpload = require('../../modules/returns/lib/jobs/start-upload')
const returnsUploadToJson = require('../../modules/returns/lib/jobs/map-to-json')
const valudateUploadedReturnsData = require('../../modules/returns/lib/jobs/validate-returns')
const persistBulkReturns = require('../../modules/returns/lib/jobs/persist-returns')
const billingCreateBillRun = require('../../modules/billing/jobs/create-bill-run')
const billingRebilling = require('../../modules/billing/jobs/rebilling')
const billingCreateCharge = require('../../modules/billing/jobs/create-charge')
const billingPopulateBatchChargeVersions = require('../../modules/billing/jobs/populate-batch-charge-versions')
const billingPrepareTransactions = require('../../modules/billing/jobs/prepare-transactions')
const billingProcessChargeVersionYear = require('../../modules/billing/jobs/process-charge-version-year')
const billingProcessChargeVersions = require('../../modules/billing/jobs/process-charge-versions')
const billingRefreshTotals = require('../../modules/billing/jobs/refresh-totals')
const billingTwoPartTariffMatching = require('../../modules/billing/jobs/two-part-tariff-matching')
const billingChargeCategoriesSyncFromCsv = require('../../modules/billing/jobs/sync-charge-categories')
const billingSupportedSourcesSyncFromCsv = require('../../modules/billing/jobs/sync-supported-sources')
const billingCustomerFileRefresh = require('../../modules/billing/jobs/customer-file-refresh')
const notificationsCheckStatus = require('../../modules/batch-notifications/lib/jobs/check-status')
const notificationsSendMessage = require('../../modules/batch-notifications/lib/jobs/send-message')
const notificationsRefreshEvent = require('../../modules/batch-notifications/lib/jobs/refresh-event')
const gaugingStationsSyncFromCsv = require('../../modules/gauging-stations/jobs/sync-gauging-stations')
const gaugingStationsCopyLicenceGaugingStationsFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-gauging-stations-from-digitise')
const gaugingStationsCopyLvpcFromDigitise = require('../../modules/gauging-stations/jobs/sync-licence-version-purpose-conditions-from-digitise')

class RegisterWorkersService {
  static go (workerManager) {
    this._jobs().forEach(job => {
      workerManager.register(job)
    })
  }

  static _jobs () {
    return [
      returnsUpload,
      returnsUploadToJson,
      valudateUploadedReturnsData,
      persistBulkReturns,
      billingCreateBillRun,
      billingRebilling,
      billingCreateCharge,
      billingPopulateBatchChargeVersions,
      billingPrepareTransactions,
      billingProcessChargeVersionYear,
      billingProcessChargeVersions,
      billingRefreshTotals,
      billingTwoPartTariffMatching,
      billingChargeCategoriesSyncFromCsv,
      billingSupportedSourcesSyncFromCsv,
      billingCustomerFileRefresh,
      notificationsCheckStatus,
      notificationsSendMessage,
      notificationsRefreshEvent,
      gaugingStationsSyncFromCsv,
      gaugingStationsCopyLicenceGaugingStationsFromDigitise,
      gaugingStationsCopyLvpcFromDigitise
    ]
  }
}

module.exports = {
  RegisterWorkersService
}
