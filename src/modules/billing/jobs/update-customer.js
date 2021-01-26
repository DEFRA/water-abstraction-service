'use strict';
const { get, partial } = require('lodash');
const chargeModuleCustomersConnector = require('../../../lib/connectors/charge-module/customers');
const JOB_NAME = 'billing.update-customer-account';
const invoiceAccountsService = require('../../../lib/services/invoice-accounts-service');
const chargeModuleMappers = require('../../../lib/mappers/charge-module');
const { logger } = require('../../../logger');
const uuid = require('uuid/v4');

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
]);

const createMessage = partial(messageInitialiser, JOB_NAME);

const handler = async job => {
  const invoiceAccountId = get(job, 'data.invoiceAccountId');
  const invoiceAccountData = await invoiceAccountsService.getByInvoiceAccountId(invoiceAccountId);
  const invoiceAccountMappedData = await chargeModuleMappers.mapInvoiceAccountToChargeModuleCustomer(invoiceAccountData);
  return chargeModuleCustomersConnector.updateCustomer(invoiceAccountMappedData);
};

const onComplete = job => {
  logger.info(`onComplete: ${job.id}`);
};

const onFailedHandler = (job, err) => {
  logger.error(`Job ${job.name} ${job.id} failed`, err);
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = onFailedHandler;
exports.hasScheduler = true;
