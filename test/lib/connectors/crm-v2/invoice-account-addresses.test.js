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

const invoiceAccountAddressesConnector = require('../../../../src/lib/connectors/crm-v2/invoice-account-addresses');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('lib/connectors/crm-v2/invoice-account-addresses', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra');
    sandbox.stub(serviceRequest, 'delete');
    sandbox.stub(serviceRequest, 'patch');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const invoiceAccountAddressId = uuid();

  experiment('.deleteInvoiceAccountAddress', () => {
    beforeEach(async () => {
      await invoiceAccountAddressesConnector.deleteInvoiceAccountAddress(invoiceAccountAddressId);
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal(`http://test.defra/invoice-account-addresses/${invoiceAccountAddressId}`);
    });
  });

  experiment('.patchInvoiceAccountAddress', () => {
    const changes = {
      startDate: '2020-01-01',
      endDate: '2021-02-01'
    };

    beforeEach(async () => {
      await invoiceAccountAddressesConnector.patchInvoiceAccountAddress(invoiceAccountAddressId, changes);
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.patch.lastCall.args;
      expect(url).to.equal(`http://test.defra/invoice-account-addresses/${invoiceAccountAddressId}`);
    });

    test('the requested changes are in the payload body', async () => {
      const [, options] = serviceRequest.patch.lastCall.args;
      expect(options.body).to.equal(changes);
    });
  });
});
