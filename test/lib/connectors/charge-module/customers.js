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
const customerApiConnector = require('../../../../src/lib/connectors/charge-module/customers');

experiment('lib/connectors/charge-module/customers', async () => {
  const tempInvoiceAccountId = await uuid();

  beforeEach(async () => {
    sandbox.stub(request, 'post').resolves();
  });
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.updateCustomer', () => {
    beforeEach(async () => {
      await customerApiConnector.updateCustomer(tempInvoiceAccountId);
    });

    test('the method is POST', async () => {
      expect(request.post.called).to.be.true();
    });

    test('the payload is equal to the resolved object from the mapInvoiceAccountToChargeModuleCustomer function', async () => {
      const [, payload] = request.post.lastCall.args;
      expect(payload).to.equal(tempInvoiceAccountId);
    });
  });
});
