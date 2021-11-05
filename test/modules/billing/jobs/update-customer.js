'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const updateCustomerJob = require('../../../../src/modules/billing/jobs/update-customer');

// Connectors
const chargeModuleCustomersConnector = require('../../../../src/lib/connectors/charge-module/customers');
const invoiceAccountsService = require('../../../../src/lib/services/invoice-accounts-service');

// Mappers
const chargeModuleMappers = require('../../../../src/lib/mappers/charge-module');

const { logger } = require('../../../../src/logger');

const invoiceAccountObject = {};

experiment('modules/billing/jobs/update-customers', () => {
  const tempInvoiceAccountId = uuid();
  const tempJobId = uuid();
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
    sandbox.stub(invoiceAccountsService, 'getByInvoiceAccountId').resolves(invoiceAccountObject);
    sandbox.stub(chargeModuleMappers, 'mapInvoiceAccountToChargeModuleCustomer').resolves();
    sandbox.stub(chargeModuleCustomersConnector, 'updateCustomer').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(updateCustomerJob.jobName).to.equal('billing.update-customer-account');
  });

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = updateCustomerJob.createMessage(
        tempInvoiceAccountId
      );
      expect(message[0]).to.equal('billing.update-customer-account');
      expect(message[1]).to.equal({
        invoiceAccountId: tempInvoiceAccountId
      });
    });
  });

  const job = {
    id: tempJobId,
    data: {
      invoiceAccountId: tempInvoiceAccountId
    }
  };

  experiment('.handler', () => {
    beforeEach(async () => {
      await updateCustomerJob.handler(job);
    });

    test('The invoice account is mapped against the CM expected schema', async () => {
      expect(chargeModuleMappers.mapInvoiceAccountToChargeModuleCustomer.calledWith(invoiceAccountObject)).to.be.true();
    });

    test('The request is sent to the CM', async () => {
      expect(chargeModuleCustomersConnector.updateCustomer.called).to.be.true();
    });
  });

  experiment('.onComplete', () => {
    beforeEach(async () => {
      await updateCustomerJob.onComplete(job);
    });

    test('an info message is logged', async () => {
      expect(logger.info.calledWith(`onComplete: ${job.id}`)).to.be.true();
    });
  });

  experiment('.onFailed', () => {
    beforeEach(async () => {
      await updateCustomerJob.onFailed(job, new Error('Some error'));
    });

    test('an error message is logged', async () => {
      expect(logger.error.calledWith(`onFailed: Job ${job.name} ${job.id} failed`)).to.be.true();
    });
  });
});
