'use strict'

/**
 * This job grabs a list of the invoice accounts whose entities have a mismatch between last_hash and current_hash.
 *
 * It then emails the NALD service mailbox with the details
 */

const config = require('../../../../config')
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts')
const { logger } = require('../../../logger')
const notifyService = require('../../../lib/notify')

const JOB_NAME = 'billing.find-update-invoice-accounts'

const createMessage = () => ([
  JOB_NAME,
  {},
  {
    repeat: {
      cron: config.jobs.checkForUpdatedInvoiceAccounts
    }
  }
])

const handler = async (job) => {
  logger.info(`Handling job ${job.name} ${job.id}`)

  // Call CRM to identify the invoice accounts
  const invoiceAccountsWithUpdatedEntities = await invoiceAccountsConnector.fetchInvoiceAccountsWithUpdatedEntities()

  logger.info(`Job ${job.name} got ${invoiceAccountsWithUpdatedEntities.length} results`)

  const templateId = config.notify.templates.nald_entity_changes_detected
  const recipient = process.env.NALD_SERVICE_MAILBOX

  if (invoiceAccountsWithUpdatedEntities.length > 0 && recipient) {
    const content = invoiceAccountsWithUpdatedEntities.map(invoiceAccount =>
      `${invoiceAccount.invoiceAccountNumber} (Legacy identifier ${invoiceAccount.companyLegacyId})`
    )
    notifyService.sendEmail(templateId, recipient, { content })
  }
}

const onFailed = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err)
}

exports.jobName = JOB_NAME
exports.createMessage = createMessage
exports.handler = handler
exports.onFailed = onFailed
