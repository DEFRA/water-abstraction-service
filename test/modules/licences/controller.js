const { expect } = require('code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('lab').script();

const controller = require('../../../src/modules/licences/controller');
const permitClient = require('../../../src/lib/connectors/permit');
const documentsClient = require('../../../src/lib/connectors/crm/documents');
const logger = require('../../../src/lib/logger');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const testRequest = {
  params: {
    documentId: '00000000-0000-0000-0000-000000000000'
  }
};

const emptyResponse = {
  data: [],
  error: null
};

const documentResponse = {
  data: [
    { system_internal_id: 'test-id' }
  ],
  error: null
};

const licenceResponse = {
  data: [{
    licence_data_value: {
      current_version: {
        purposes: [
          {
            licenceConditions: []
          }
        ]
      }
    },
    licence_ref: 'test-id'
  }],
  error: null
};

experiment('getLicenceByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(permitClient.licences, 'findMany');
    sandbox.stub(documentsClient, 'findMany');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns 404 for unknown document id', async () => {
    documentsClient.findMany.resolves(emptyResponse);
    const response = await controller.getLicenceByDocumentId(testRequest);
    expect(response.output.statusCode).to.equal(404);
  });

  test('returns 404 for unknown licence id', async () => {
    documentsClient.findMany.resolves(documentResponse);
    permitClient.licences.findMany.resolves(emptyResponse);
    const response = await controller.getLicenceByDocumentId(testRequest);
    expect(response.output.statusCode).to.equal(404);
  });

  test('returns expected licence', async () => {
    documentsClient.findMany.resolves(documentResponse);
    permitClient.licences.findMany.resolves(licenceResponse);
    const response = await controller.getLicenceByDocumentId(testRequest);
    expect(response.data.licence_ref).to.equal('test-id');
    expect(permitClient.licences.findMany.calledWith({
      licence_id: 'test-id'
    })).to.be.true();
  });

  test('provides error details in the event of a major error', async () => {
    documentsClient.findMany.rejects(new Error('fail'));
    await controller.getLicenceByDocumentId(testRequest);
    const loggedError = logger.error.lastCall.args[1];
    expect(loggedError.params).to.equal({ documentId: testRequest.params.documentId });
    expect(loggedError.context).to.exist();
  });
});

experiment('getLicenceConditionsByDocumentId', () => {
  beforeEach(async () => {
    sandbox.stub(permitClient.licences, 'findMany');
    sandbox.stub(documentsClient, 'findMany');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('returns 404 for unknown document id', async () => {
    documentsClient.findMany.resolves(emptyResponse);
    const response = await controller.getLicenceConditionsByDocumentId(testRequest);
    expect(response.output.statusCode).to.equal(404);
  });

  test('returns 404 for unknown licence id', async () => {
    documentsClient.findMany.resolves(documentResponse);
    permitClient.licences.findMany.resolves(emptyResponse);
    const response = await controller.getLicenceConditionsByDocumentId(testRequest);
    expect(response.output.statusCode).to.equal(404);
  });

  test('returns expected conditions', async () => {
    documentsClient.findMany.resolves(documentResponse);
    permitClient.licences.findMany.resolves(licenceResponse);
    const response = await controller.getLicenceConditionsByDocumentId(testRequest);
    expect(response.data).to.be.an.array();
  });

  test('provides error details in the event of a major error', async () => {
    documentsClient.findMany.rejects(new Error('fail'));
    await controller.getLicenceConditionsByDocumentId(testRequest);
    const loggedError = logger.error.lastCall.args[1];
    expect(loggedError.params).to.equal({ documentId: testRequest.params.documentId });
    expect(loggedError.context).to.exist();
  });
});
