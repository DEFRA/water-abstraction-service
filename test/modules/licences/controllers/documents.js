'use strict';

const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();

const { cloneDeep } = require('lodash');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../../src/modules/licences/controllers/documents');
const queries = require('../../../../src/modules/licences/lib/queries');
const permitClient = require('../../../../src/lib/connectors/permit');
const documentsClient = require('../../../../src/lib/connectors/crm/documents');
const crmEntities = require('../../../../src/lib/connectors/crm/entities');
const idmConnector = require('../../../../src/lib/connectors/idm');
const { logger } = require('../../../../src/logger');
const eventHelper = require('../../../../src/modules/licences/lib/event-helper');
const licencesService = require('../../../../src/lib/services/licences');

const { licences } = require('../../../responses/permits/licence');

let testRequest;

const emptyResponse = {
  data: [],
  error: null
};

const documentResponse = {
  data: [
    { document_name: 'test-doc-name', system_internal_id: 'test-id', company_entity_id: 'test-entity-id' }
  ],
  error: null
};

const licenceResponse = {
  data: [{
    licence_data_value: {
      EXPIRY_DATE: '01/02/2003',
      LAPSED_DATE: 'NULL',
      REV_DATE: '04/05/2006',
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

const getNotificationsResponse = () => ([{
  id: 'message_123',
  send_after: '2018-12-13T16:04:22.000Z',
  issuer: 'mail@example.com',
  event_metadata: {
    name: 'Notification type'
  },
  type: 'letter'
}]);

experiment('modules/licences/controllers/documents', () => {
  beforeEach(async () => {
    testRequest = {
      params: {
        documentId: '00000000-0000-0000-0000-000000000000'
      },
      query: {}
    };

    sandbox.stub(crmEntities, 'getEntityCompanies');

    sandbox.stub(documentsClient, 'getDocumentUsers');
    sandbox.stub(documentsClient, 'findMany');
    sandbox.stub(documentsClient, 'findOne');
    sandbox.stub(documentsClient, 'setLicenceName');

    sandbox.stub(eventHelper, 'saveEvent');

    sandbox.stub(licencesService, 'getLicenceByLicenceRef');

    sandbox.stub(logger, 'error');

    sandbox.stub(permitClient.licences, 'findMany');

    sandbox.stub(queries, 'getNotificationsForLicence');

    sandbox.stub(idmConnector.usersClient, 'getUsersByExternalId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceByDocumentId', () => {
    beforeEach(async () => {
      licencesService.getLicenceByLicenceRef.resolves({ id: 'test-licence-id' });
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
        licence_id: 'test-id',
        licence_regime_id: 1,
        licence_type_id: 8
      })).to.be.true();
    });

    test('adds the earliest end date to the licence data', async () => {
      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(licenceResponse);
      const response = await controller.getLicenceByDocumentId(testRequest);

      expect(response.data.earliestEndDate).to.equal('2003-02-01');
      expect(response.data.earliestEndDateReason).to.equal('expired');
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicenceByDocumentId(testRequest);
      const errorParams = logger.error.lastCall.args[2];
      expect(errorParams).to.equal({ documentId: testRequest.params.documentId });
    });

    test('requests expired licences if the includeExpired query param is truthy', async () => {
      const request = cloneDeep(testRequest);
      request.query.includeExpired = true;
      await controller.getLicenceByDocumentId(request);

      const [filter] = documentsClient.findMany.lastCall.args;

      expect(filter.document_id).to.equal(testRequest.params.documentId);
      expect(filter.includeExpired).to.be.true();
    });

    test('augments the licence with some of the document details', async () => {
      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(licenceResponse);
      const response = await controller.getLicenceByDocumentId(testRequest);
      expect(response.data.document.name).to.equal('test-doc-name');
    });

    test('augments the licence with the licence id from the water service', async () => {
      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(licenceResponse);
      const response = await controller.getLicenceByDocumentId(testRequest);
      expect(response.data.id).to.equal('test-licence-id');
    });

    test('returns a 401 if the user company cannot access the document ', async () => {
      testRequest.query.companyId = '11111111-2222-3333-4444-555555555555';
      documentsClient.findMany.resolves(documentResponse);

      const response = await controller.getLicenceByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(401);
    });
  });

  experiment('getLicenceConditionsByDocumentId', () => {
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
      const params = logger.error.lastCall.args[2];
      expect(params.documentId).to.equal(testRequest.params.documentId);
    });
  });

  experiment('getLicencePointsByDocumentId', () => {
    test('returns 404 for unknown document id', async () => {
      documentsClient.findMany.resolves(emptyResponse);
      const response = await controller.getLicencePointsByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('returns 404 for unknown licence id', async () => {
      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(emptyResponse);
      const response = await controller.getLicencePointsByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('returns expected points', async () => {
      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(licenceResponse);
      const response = await controller.getLicencePointsByDocumentId(testRequest);
      expect(response.data).to.be.an.array();
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicencePointsByDocumentId(testRequest);
      const params = logger.error.lastCall.args[2];
      expect(params.documentId).to.equal(testRequest.params.documentId);
    });
  });

  experiment('getLicenceUsersByDocumentId', () => {
    test('returns 404 for unknown document id', async () => {
      documentsClient.getDocumentUsers.rejects({ statusCode: 404 });
      const response = await controller.getLicenceUsersByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('combines IDM and CRM responses to give required data', async () => {
      documentsClient.getDocumentUsers.resolves({
        error: null,
        data: [
          {
            entityId: 'aa11',
            roles: ['primary_user'],
            entityName: 'user1@example.com'
          },
          {
            entityId: 'bb22',
            roles: ['user_returns', 'user'],
            entityName: 'user2@example.com'
          },
          {
            entityId: 'cc33',
            roles: ['user'],
            entityName: 'user3@example.com'
          }
        ]
      });

      idmConnector.usersClient.getUsersByExternalId.resolves({
        error: null,
        data: [
          { user_id: 1111, user_name: 'user1@example.com', external_id: 'aa11' },
          { user_id: 2222, user_name: 'user2@example.com', external_id: 'bb22' }
        ]
      });

      const response = await controller.getLicenceUsersByDocumentId(testRequest);
      expect(response.data).to.equal([
        {
          entityId: 'aa11',
          userId: 1111,
          userName: 'user1@example.com',
          roles: ['primary_user']
        },
        {
          entityId: 'bb22',
          userId: 2222,
          userName: 'user2@example.com',
          roles: ['user_returns', 'user']
        }
      ]);
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicencePointsByDocumentId(testRequest);
      const params = logger.error.lastCall.args[2];
      expect(params.documentId).to.equal(testRequest.params.documentId);
    });
  });

  experiment('getLicenceSummaryByDocumentId', () => {
    beforeEach(async () => {
      licencesService.getLicenceByLicenceRef.resolves({
        id: 'test-licence-id'
      });

      documentsClient.findMany.resolves(documentResponse);
      permitClient.licences.findMany.resolves(licences());
    });

    test('returns 404 when document not found', async () => {
      documentsClient.findMany.resolves({ data: [] });
      const response = await controller.getLicenceSummaryByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('transforms permit repo data into a form expected by UI', async () => {
      const response = await controller.getLicenceSummaryByDocumentId(testRequest);

      expect(response).to.be.an.object();

      expect(Object.keys(response.data)).to.include([
        'licenceNumber',
        'licenceHolderTitle',
        'licenceHolderInitials',
        'licenceHolderName',
        'effectiveDate',
        'expiryDate',
        'versionCount',
        'conditions',
        'points',
        'abstractionPeriods',
        'aggregateQuantity',
        'contacts',
        'purposes',
        'uniquePurposeNames',
        'documentName'
      ]);
    });

    test('adds the licence model to the waterService property', async () => {
      const response = await controller.getLicenceSummaryByDocumentId(testRequest);

      const [licenceNumber] = licencesService.getLicenceByLicenceRef.lastCall.args;

      expect(licenceNumber).to.equal('12/34/56/78');

      expect(response.data.waterLicence.id).to.equal('test-licence-id');
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicenceSummaryByDocumentId(testRequest);
      const params = logger.error.lastCall.args[2];
      expect(params.documentId).to.equal(testRequest.params.documentId);
    });
  });

  experiment('getLicenceCommunicationsByDocumentId', () => {
    test('returns 404 for unknown document id', async () => {
      documentsClient.findMany.rejects({ statusCode: 404 });
      const response = await controller.getLicenceCommunicationsByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('transforms messages data into a form expected by UI', async () => {
      documentsClient.findMany.resolves(documentResponse);
      queries.getNotificationsForLicence.resolves(getNotificationsResponse());

      const response = await controller.getLicenceCommunicationsByDocumentId(testRequest);

      expect(response).to.be.an.object();
      expect(response.error).to.equal(null);
      expect(response.data).to.equal([
        {
          notificationId: 'message_123',
          messageType: undefined,
          date: '2018-12-13T16:04:22.000Z',
          notificationType: 'Notification type',
          sender: 'mail@example.com',
          isPdf: false
        }]);
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicenceCommunicationsByDocumentId(testRequest);
      const params = logger.error.lastCall.args[2];
      expect(params).to.equal({ documentId: testRequest.params.documentId });
    });

    test('sets isPdf to true if the notification message_ref starts with pdf.', async () => {
      const notificationResponse = getNotificationsResponse();
      notificationResponse[0].message_ref = 'pdf.testing';

      documentsClient.findMany.resolves(documentResponse);
      queries.getNotificationsForLicence.resolves(notificationResponse);

      const response = await controller.getLicenceCommunicationsByDocumentId(testRequest);

      expect(response.data[0].isPdf).to.be.true();
    });

    test('can request expired licences by setting includeExpired to true', async () => {
      const request = cloneDeep(testRequest);
      request.query.includeExpired = true;
      await controller.getLicenceCommunicationsByDocumentId(request);

      const [filter] = documentsClient.findMany.lastCall.args;

      expect(filter.document_id).to.equal(testRequest.params.documentId);
      expect(filter.includeExpired).to.be.true();
    });
  });

  experiment('getLicenceCompanyByDocumentId', () => {
    const companyData = { data: { entityName: 'test-name' } };

    test('returns 404 for unknown document id', async () => {
      documentsClient.findMany.rejects({ statusCode: 404 });
      const response = await controller.getLicenceCompanyByDocumentId(testRequest);
      expect(response.output.statusCode).to.equal(404);
    });

    test('gets company data with company_entity_id from document', async () => {
      documentsClient.findMany.resolves(documentResponse);
      crmEntities.getEntityCompanies.resolves(companyData);
      await controller.getLicenceCompanyByDocumentId(testRequest);
      expect(crmEntities.getEntityCompanies.calledWith(
        documentResponse.data[0].company_entity_id)).to.be.true();
    });

    test('provides error details in the event of a major error', async () => {
      documentsClient.findMany.rejects(new Error('fail'));
      await controller.getLicenceCompanyByDocumentId(testRequest);
      const params = logger.error.lastCall.args[2];
      expect(params).to.equal({ documentId: testRequest.params.documentId });
    });

    test('returns the expected licence company details', async () => {
      documentsClient.findMany.resolves(documentResponse);
      crmEntities.getEntityCompanies.resolves(companyData);
      const { data, error } = await controller.getLicenceCompanyByDocumentId(testRequest);
      expect(data.entityId).to.equal(documentResponse.data[0].company_entity_id);
      expect(data.companyName).to.equal(companyData.data.entityName);
      expect(data.licenceNumber).to.equal(documentResponse.data[0].system_external_id);
      expect(error).to.be.null();
    });
  });

  experiment('postLicenceName', () => {
    const testRequest = {
      params: {
        documentId: '00000000-0000-0000-0000-000000000000'
      },
      payload: {
        documentName: 'test-doc-name',
        userName: 'test-user@sinon.com'
      }
    };

    beforeEach(async () => {
      eventHelper.saveEvent.resolves({ id: 'event-id' });
    });

    test('returns the expected document header details with eventId and metadata', async () => {
      const documentResponse = {
        data: {
          document_id: 'test-id',
          document_name: 'test-doc-name',
          system_internal_id: 'test-id',
          company_entity_id: 'test-entity-id',
          system_external_id: '01/118'
        }
      };
      documentsClient.setLicenceName.resolves(documentResponse);
      documentsClient.findOne.resolves({ data: { document_name: 'test-name' } });
      const data = await controller.postLicenceName(testRequest);
      expect(data.documentId).to.equal(testRequest.params.documentId);
      expect(data.licenceNumber).to.equal(documentResponse.data.system_external_id);
      expect(data.eventId).to.equal('event-id');
      expect(data.documentName).to.equal(documentResponse.data.document_name);
      expect(data.rename).to.equal(true);
    });

    test('returns an error if the document has not been found', async () => {
      documentsClient.findOne.resolves({ data: null });
      try {
        await controller.postLicenceName(testRequest);
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(404);
      }
    });
  });
});
