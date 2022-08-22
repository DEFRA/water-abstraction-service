'use strict'
const moment = require('moment')

const JOB_NAME = 'billing.customer-file-refresh'

const config = require('../../../../config')
const chargeModuleCustomersConnector = require('../../../lib/connectors/charge-module/customers')
const invoiceAccountsService = require('../../../lib/services/invoice-accounts-service')

const { logger } = require('../../../logger')

const createMessage = batchId => ([
  JOB_NAME,
  {
    batchId
  },
  {
    jobId: JOB_NAME,
    repeat: {
      every: config.chargeModule.customerFileRefreshFrequencyInMS
    }
  }
])

const handler = async job => {
  logger.info(`${JOB_NAME}: Job has started`)
  const customerFileData = await chargeModuleCustomersConnector.getCustomerFiles(7)

  customerFileData.forEach(customerFile => {
    const { fileReference, exportedAt, exportedCustomers } = customerFile
    invoiceAccountsService.updateInvoiceAccountsWithCustomerFileReference(fileReference, moment(exportedAt).format('YYYY-MM-DD'), exportedCustomers)
  })
}

const onFailedHandler = async (job, err) =>
  logger.error('Failed to fetch customer file data from the charging module', err)

const onComplete = async () => {
  logger.info(`${JOB_NAME}: Job has completed`)
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.startClean = true
exports.onFailed = onFailedHandler
exports.onComplete = onComplete
exports.hasScheduler = true
