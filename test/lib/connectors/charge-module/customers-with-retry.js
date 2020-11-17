'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');
const request = require('../../../../src/lib/connectors/charge-module/request');
const customersApiConnectorWithRetry = require('../../../../src/lib/connectors/charge-module/customers-with-retry');

const invoiceAccountsConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts');
const customerApiConnector = require('../../../../src/lib/connectors/charge-module/customers');

const chargeModuleMappers = require('../../../../src/lib/mappers/charge-module');

const config = require('../../../../config');

experiment('lib/connectors/charge-module/customers-with-retry', async () => {
  let result;

  const tempInvoiceAccountId = await uuid();
  const resolutionObject = {
    accountNumber: 'A12345678A'
  };

  beforeEach(async () => {
    sandbox.stub(request, 'get').resolves();
    sandbox.stub(request, 'post').resolves();
    sandbox.stub(request, 'patch').resolves();
    sandbox.stub(request, 'delete').resolves();
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountById').resolves();
    sandbox.stub(chargeModuleMappers, 'mapInvoiceAccountToChargeModuleCustomer').resolves(resolutionObject);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.updateCustomer', () => {
    beforeEach(async () => {
      result = await customersApiConnectorWithRetry.updateCustomer(tempInvoiceAccountId);
    });

    test('the method is POST', async () => {
      expect(request.post.called).to.be.true();
    });

    test('the correct endpoint is called', async () => {
      const [path] = request.post.lastCall.args;
      expect(path).to.equal('v1/wrls/customer_changes');
    });
  });
});
