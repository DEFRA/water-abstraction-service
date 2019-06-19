const Lab = require('lab');

const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();

// Connectors
const Permit = require('../../../src/lib/connectors/permit');
const documentsConnector = require('../../../src/lib/connectors/crm/documents');
const notify = require('../../../src/controllers/tasks/lib/notify');
const { logger } = require('../../../src/logger');

// Response data
const permitResponse = require('../../responses/permits/licence');
const documentsResponse = require('../../responses/crm/documentHeader');

// Code under test
const scheduleRenewalEmails = require('../../../src/controllers/tasks/scheduleRenewalEmails');

const createError = () => {
  const err = new Error('oh no!');
  err.statusCode = 404;
  err.options = { uri: 'http://uri' };
  return err;
};

experiment('scheduleRenewalEmails', () => {
  let responses = {};

  beforeEach(async () => {
    responses = {
      permit: permitResponse.getExpiringLicence().data,
      document: documentsResponse.singleResponse().data,
      unnamedDocument: set(documentsResponse.singleResponse().data, '0.document_name', null),
      documentUsers: documentsResponse.multipleDocumentUsers()
    };

    sandbox.stub(Permit.expiringLicences, 'findAll').resolves(responses.permit);
    sandbox.stub(documentsConnector, 'findAll').resolves(responses.document);
    sandbox.stub(documentsConnector, 'getDocumentUsers').resolves(responses.documentUsers);
    sandbox.stub(notify, 'sendMessage').resolves();
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('finds CRM documents using the licence ID from permit repo', async () => {
    await scheduleRenewalEmails.run();
    const [filter] = documentsConnector.findAll.lastCall.args;
    expect(filter).to.equal({
      system_internal_id: responses.permit[0].licence_id
    });
  });

  test('finds CRM document users using the document header ID', async () => {
    await scheduleRenewalEmails.run();
    const [ documentId ] = documentsConnector.getDocumentUsers.lastCall.args;
    expect(documentId).to.equal(responses.document[0].document_id);
  });

  experiment('calls the notify enqueue function with a config object', () => {
    let config;

    beforeEach(async () => {
      await scheduleRenewalEmails.run();
      config = notify.sendMessage.lastCall.args[0];
    });

    test('the message ID is based on the licence number and date', async () => {
      expect(config.id).to.equal('12/34/56/78_01/01/2021_john@example.com');
    });

    test('the recipient is the primary user', async () => {
      expect(config.recipient).to.equal('john@example.com');
    });

    test('the message ref is correct', async () => {
      expect(config.messageRef).to.equal('expiry_notification_email');
    });

    test('includes personalisation for the Notify template', async () => {
      expect(config.personalisation.licence_no).to.equal('12/34/56/78');
      expect(config.personalisation.licence_name).to.equal('A document name');
    });

    test('the individual CRM entity related to the primary user role', async () => {
      expect(config.individualEntityId).to.equal('individal_entity_id_2');
    });

    test('the company entity related to the CRM document', async () => {
      expect(config.companyEntityId).to.equal('company-entity-id');
    });

    test('the licence numbers relate to the expiring licence', async () => {
      expect(config.licences).to.equal(['12/34/56/78']);
    });
  });

  experiment('when the document name is not set', async () => {
    let config;

    beforeEach(async () => {
      documentsConnector.findAll.resolves(responses.unnamedDocument);
      await scheduleRenewalEmails.run();
      config = notify.sendMessage.lastCall.args[0];
    });

    test('the personalisation for document name is an empty string', async () => {
      expect(config.personalisation.licence_name).to.equal('');
    });
  });

  test('does not return an error', async () => {
    const result = await scheduleRenewalEmails.run();
    expect(result).to.equal({ error: null });
  });

  experiment('logs error', () => {
    let err;
    beforeEach(async () => {
      err = createError();
      documentsConnector.getDocumentUsers.rejects(err);
    });

    test('the logged error should include a message and params', async () => {
      await scheduleRenewalEmails.run();
      const [message, data] = logger.error.lastCall.args;

      expect(message).to.be.a.string();
      expect(data).to.equal({
        statusCode: err.statusCode,
        uri: err.options.uri
      });
    });

    test('returns an error which can be stored in the database', async () => {
      const result = await scheduleRenewalEmails.run();
      expect(result.error).to.be.a.string();
    });
  });
});
