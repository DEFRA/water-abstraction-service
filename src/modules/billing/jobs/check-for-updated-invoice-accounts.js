'use strict';
/**
 * This file contains the job handler and createMessage function
 * for grabbing a list of the invoice accounts whose entities have
 * a mismatch between last_hash and current_hash.
 */
const cron = require('node-cron');
const moment = require('moment');
const { logger } = require('../../../logger');
const config = require('../../../../config');
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');
const messageQueue = require('../../../lib/message-queue-v2');
const { jobNames } = require('../../../lib/constants');
const notifyService = require('../../../lib/notify');

const createMessage = () => {
  return ([
    jobNames.findUpdatedInvoiceAccounts,
    {},
    {
      jobId: `${jobNames.findUpdatedInvoiceAccounts}.${moment().format('YYYYMMDDA')}`
    }
  ]);
};

const handler = async () => {
  logger.info(`Processing ${jobNames.findUpdatedInvoiceAccounts}`);

  // Call CRM to identify the invoice accounts
  const invoiceAccountsWithUpdatedEntities = await invoiceAccountsConnector.fetchInvoiceAccountsWithUpdatedEntities();
  const templateId = config.notify.templates.nald_entity_changes_detected;
  const recipient = process.env.NALD_SERVICE_MAILBOX;

  if (invoiceAccountsWithUpdatedEntities.length > 0 && recipient) {
    const content = invoiceAccountsWithUpdatedEntities.map(invoiceAccount => `
      ${invoiceAccount.invoiceAccountNumber} (Legacy identifier ${invoiceAccount.companyLegacyId})
    `);
    notifyService.sendEmail(templateId, recipient, { content });
  }
};

const onFailedHandler = async (job, err) => logger.error(err.message);

cron.schedule('0 */12 * * *', () => messageQueue.getQueueManager().add(jobNames.findUpdatedInvoiceAccounts, {}));

exports.jobName = jobNames.findUpdatedInvoiceAccounts;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = onFailedHandler;
