'use strict';
/**
 * This file contains the job handler and createMessage function
 * for grabbing a list of the invoice accounts whose entities have
 * a mismatch between last_hash and current_hash.
 */
const cron = require('node-cron');
const moment = require('moment');
const { logger } = require('../../../logger');
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');
const messageQueue = require('../../../lib/message-queue-v2');
const { jobNames } = require('../../../lib/constants');

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

  // Publish a job which will call CM with each of the invoice account IDs
  invoiceAccountsWithUpdatedEntities.map(invoiceAccount => messageQueue.getQueueManager().add(jobNames.updateCustomerAccount, invoiceAccount.invoiceAccountId));
};

const onFailedHandler = async (job, err) => logger.error(err.message);

cron.schedule('0 */12 * * *', () => messageQueue.getQueueManager().add(jobNames.findUpdatedInvoiceAccounts, {}));

exports.jobName = jobNames.findUpdatedInvoiceAccounts;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onFailed = onFailedHandler;
