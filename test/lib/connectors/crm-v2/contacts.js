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

const contacts = require('../../../../src/lib/connectors/crm-v2/contacts');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('lib/connectors/crm-v2/contacts', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra');
    sandbox.stub(serviceRequest, 'get').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getContact', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves({
        contactId: 'test-contact-id'
      });

      response = await contacts.getContact('test-contact-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/contacts/test-contact-id');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal({
        contactId: 'test-contact-id'
      });
    });
  });

  experiment('.getContacts', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves([
        { contactId: 'test-contact-id-1' },
        { contactId: 'test-contact-id-2' }
      ]);

      response = await contacts.getContacts([
        'test-contact-id-1',
        'test-contact-id-2'
      ]);
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/contacts');
    });

    test('adds the contacts ids to the query string as a comma separated string', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qs.id).to.equal([
        'test-contact-id-1',
        'test-contact-id-2'
      ]);
    });

    test('sets the querystring options to allow repeating params', async () => {
      const [, options] = serviceRequest.get.lastCall.args;
      expect(options.qsStringifyOptions.arrayFormat).to.equal('repeat');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal([
        { contactId: 'test-contact-id-1' },
        { contactId: 'test-contact-id-2' }
      ]);
    });
  });
});
