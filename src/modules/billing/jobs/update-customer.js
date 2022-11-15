'use strict'
const { get, partial } = require('lodash')
const chargeModuleCustomersConnector = require('../../../lib/connectors/charge-module/customers')
const { jobNames } = require('../../../lib/constants')
const JOB_NAME = jobNames.updateCustomerAccount
const invoiceAccountsService = require('../../../lib/services/invoice-accounts-service')
const chargeModuleMappers = require('../../../lib/mappers/charge-module')
const { logger } = require('../../../logger')
const { v4: uuid } = require('uuid')

const messageInitialiser = (jobName, invoiceAccountId) => ([
  JOB_NAME,
  {
    invoiceAccountId
  },
  {
    jobId: `${JOB_NAME}.${invoiceAccountId}.${uuid()}`,
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true
  }
])

const createMessage = partial(messageInitialiser, JOB_NAME)

const handler = async job => {
  try {
    const invoiceAccountId = get(job, 'data.invoiceAccountId')
    const invoiceAccountData = await invoiceAccountsService.getByInvoiceAccountId(invoiceAccountId)
    const invoiceAccountMappedData = await chargeModuleMappers.mapInvoiceAccountToChargeModuleCustomer(invoiceAccountData)
    return chargeModuleCustomersConnector.updateCustomer(invoiceAccountMappedData)
  } catch (e) {
    logger.error(new Error('Could not update CM with customer details.', e.stack))
    return new Error('Could not update CM with customer details.')
  }
}

const onComplete = job => {
  logger.info(`onComplete: ${job.id}`)
}

const onFailedHandler = (job, err) => {
  logger.error(`onFailed: Job ${job.name} ${job.id} failed`, err.stack)
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onComplete = onComplete
exports.onFailed = onFailedHandler
exports.hasScheduler = true
