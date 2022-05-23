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
const documentsConnector = require('../../../src/lib/connectors/crm-v2/documents');
const documentsService = require('../../../src/lib/services/documents-service');
const Document = require('../../../src/lib/models/document');
const { NotFoundError } = require('../../../src/lib/errors');

const licenceNumber = '01/123';
const date = '2020-01-01';

experiment('modules/billing/services/documents-service', () => {
  beforeEach(async () => {
    sandbox.stub(documentsConnector, 'getDocuments');
    sandbox.stub(documentsConnector, 'getDocument');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getDocument', () => {
    let result;

    experiment('when the document is found', () => {
      beforeEach(async () => {
        documentsConnector.getDocument.resolves({
          documentId: uuid(),
          status: 'current',
          startDate: '2020-01-01',
          endDate: null
        });
        result = await documentsService.getDocument('test-id');
      });

      test('calls the connector with the correct id', async () => {
        expect(documentsConnector.getDocument.calledWith('test-id')).to.be.true();
      });

      test('resolves with a document', async () => {
        expect(result).to.be.an.instanceof(Document);
      });
    });

    experiment('when the document is not found', () => {
      beforeEach(async () => {
        documentsConnector.getDocument.resolves();
      });

      test('throws a not found error', async () => {
        const func = () => documentsService.getDocument('test-id');
        const err = await expect(func()).to.reject();
        expect(err).to.be.instanceof(NotFoundError);
        expect(err.message).to.equal('Document test-id not found');
      });
    });
  });

  experiment('.getValidDocumentOnDate', () => {
    experiment('when no documents are found', () => {
      let result;

      beforeEach(async () => {
        documentsConnector.getDocuments.resolves([]);
        result = await documentsService.getValidDocumentOnDate(licenceNumber, date);
      });

      test('gets documents for the supplied licence number', async () => {
        expect(documentsConnector.getDocuments.calledWith(licenceNumber)).to.be.true();
      });

      test('returns null', async () => {
        expect(result).to.equal(null);
      });
    });

    experiment('when documents are found', () => {
      const documentId = uuid();
      let document;

      beforeEach(async () => {
        documentsConnector.getDocuments.resolves([{
          documentId: uuid(),
          status: 'draft',
          startDate: '2019-01-01',
          endDate: null
        },
        {
          documentId: uuid(),
          status: 'superseded',
          startDate: '2018-01-01',
          endDate: '2019-12-31'
        },
        {
          documentId,
          status: 'current',
          startDate: '2020-01-01',
          endDate: null
        }]);

        documentsConnector.getDocument.resolves({
          documentId,
          status: 'current',
          startDate: '2020-01-01',
          endDate: null
        });

        document = await documentsService.getValidDocumentOnDate(licenceNumber, date);
      });

      test('gets documents for the supplied licence number', async () => {
        expect(documentsConnector.getDocuments.calledWith(licenceNumber));
      });

      test('gets document for the current/superseded document with correct date range', async () => {
        expect(documentsConnector.getDocument.calledWith(documentId)).to.be.true();
      });

      test('resolves with Document model', async () => {
        expect(document).to.be.an.instanceof(Document);
        expect(document.id).to.equal(documentId);
      });
    });

    experiment('when documents are found, but none are current/superseded on date specified', () => {
      beforeEach(async () => {
        documentsConnector.getDocuments.resolves([{
          documentId: uuid(),
          status: 'draft',
          startDate: '2019-01-01',
          endDate: null
        },
        {
          documentId: uuid(),
          status: 'superseded',
          startDate: '2018-01-01',
          endDate: '2019-12-31'
        },
        {
          documentId: uuid(),
          status: 'draft',
          startDate: '2020-01-01',
          endDate: null
        }]);
      });

      test('returns null', async () => {
        const result = await documentsService.getValidDocumentOnDate(licenceNumber, date);
        expect(result).to.equal(null);
      });
    });
  });
});
