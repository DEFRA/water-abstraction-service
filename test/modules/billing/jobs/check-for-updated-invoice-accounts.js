'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const moment = require('moment');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const checkForUpdatedInvoiceAccountsJob = require('../../../../src/modules/billing/jobs/check-for-updated-invoice-accounts');

const invoiceAccountsConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts');
const messageQueue = require('../../../../src/lib/message-queue-v2');
const notifyService = require('../../../../src/lib/notify');
const { logger } = require('../../../../src/logger');

experiment('modules/billing/jobs/update-customers', () => {
  const invoiceAccountsReturned = [{
    invoiceAccountId: uuid()
  }];

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    sandbox.stub(notifyService, 'sendEmail');
    sandbox.stub(invoiceAccountsConnector, 'fetchInvoiceAccountsWithUpdatedEntities').resolves(invoiceAccountsReturned);
    sandbox.stub(messageQueue, 'getQueueManager').returns({
      add: sandbox.spy()
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(checkForUpdatedInvoiceAccountsJob.jobName).to.equal('billing.find-update-invoice-accounts');
  });

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = checkForUpdatedInvoiceAccountsJob.createMessage();
      expect(message[0]).to.equal('billing.find-update-invoice-accounts');
      expect(message[1]).to.equal({});
      expect(message[2]).to.equal({
        jobId: `billing.find-update-invoice-accounts.${moment().format('YYYYMMDDA')}`
      });
    });
  });

  experiment('.handler', () => {
    beforeEach(async () => {
      await checkForUpdatedInvoiceAccountsJob.handler();
    });

    test('Calls the CRM to fetch relevant invoice accounts', async () => {
      expect(invoiceAccountsConnector.fetchInvoiceAccountsWithUpdatedEntities.called).to.be.true();
    });

  //  test('Calls the notify web service', async () => {
  //    expect(notifyService.sendEmail.called).to.be.true();
  //  });
  });

  experiment('.onFailed', () => {
    beforeEach(async () => {
      await checkForUpdatedInvoiceAccountsJob.onFailed({ name: 'Some job', id: 123 }, new Error({ message: 'Some error' }));
    });

    test('an error message is logged', async () => {
      expect(logger.error.called).to.be.true();
    });
  });
});
