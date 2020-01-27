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

const invoiceAccountConnector = require('../../../../src/lib/connectors/crm-v2/invoice-accounts');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('lib/connectors/crm-v2/invoice-accounts', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra');
    sandbox.stub(serviceRequest, 'get').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoiceAccountsByIds', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves([
        { invoiceAccountId: 'test-id-1' },
        { invoiceAccountId: 'test-id-2' }
      ]);

      response = await invoiceAccountConnector.getInvoiceAccountsByIds([
        'test-id-1',
        'test-id-2'
      ]);
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/invoice-accounts');
    });

    test('adds the invoice account ids to the query string', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.id).to.equal([
        'test-id-1',
        'test-id-2'
      ]);
    });

    test('sets the querystring options to allow repeating params', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qsStringifyOptions.arrayFormat).to.equal('repeat');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal([
        { invoiceAccountId: 'test-id-1' },
        { invoiceAccountId: 'test-id-2' }
      ]);
    });
  });

  experiment('.getInvoiceAccountById', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves({ invoiceAccountId: 'test-id-1' });
      response = await invoiceAccountConnector.getInvoiceAccountById('test-id-1');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/invoice-accounts/test-id-1');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal({ invoiceAccountId: 'test-id-1' });
    });
  });
});
