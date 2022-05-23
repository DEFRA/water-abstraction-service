'use strict';

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Licence = require('../../../../src/lib/models/licence');

const controller = require('../../../../src/modules/returns/controllers/controller');
const returnsFacade = require('../../../../src/modules/returns/lib/facade');
const apiConnector = require('../../../../src/modules/returns/lib/api-connector');
const eventsService = require('../../../../src/lib/services/events');
const licencesService = require('../../../../src/lib/services/licences');
const returnsService = require('../../../../src/lib/services/returns');

const returnId = 'v1:1:01/123:1234:2020-04-01:2020:05:31';
const versionId = uuid();
const returnData = {
  return: {
    return_id: returnId,
    licence_ref: '01/123',
    start_date: '2020-04-01',
    end_date: '2020-05-31',
    due_date: '2020-06-28',
    received_date: null,
    status: 'due',
    returns_frequency: 'month',
    metadata: { foo: 'bar' },
    under_query: false
  },
  version: null,
  versions: [],
  lines: []
};

experiment('modules/returns/controllers/controller', () => {
  let request, response;

  beforeEach(async () => {
    sandbox.stub(returnsFacade, 'getReturnData').resolves(returnData);
    sandbox.stub(apiConnector, 'persistReturnData');
    sandbox.stub(apiConnector, 'patchReturnData');
    sandbox.stub(eventsService, 'update');
    sandbox.stub(licencesService, 'getLicencesByLicenceRefs');
    sandbox.stub(returnsService, 'getReturnsWithContactsForLicence');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturn', () => {
    beforeEach(async () => {
      request = {
        query: {
          versionNumber: 1,
          returnId
        }
      };
      response = await controller.getReturn(request);
    });

    test('return returns facade is called with the return ID and version number', async () => {
      expect(returnsFacade.getReturnData.calledWith(
        returnId, request.query.versionNumber
      )).to.be.true();
    });

    test('the response is mapped to the expected shape', async () => {
      const keys = Object.keys(response);
      expect(keys).to.only.include([
        'returnId', 'licenceNumber',
        'receivedDate', 'startDate',
        'endDate', 'dueDate',
        'frequency', 'isNil',
        'status', 'versionNumber',
        'isCurrent', 'reading',
        'meters', 'requiredLines',
        'lines', 'metadata',
        'versions', 'isUnderQuery'
      ]);
    });

    test('the return properties are mapped', async () => {
      expect(response.returnId).to.equal(returnId);
      expect(response.licenceNumber).to.equal(returnData.return.licence_ref);
      expect(response.receivedDate).to.be.null();
      expect(response.startDate).to.equal('2020-04-01');
      expect(response.endDate).to.equal('2020-05-31');
      expect(response.dueDate).to.equal('2020-06-28');
      expect(response.frequency).to.equal('month');
      expect(response.status).to.equal('due');
      expect(response.metadata).to.equal({ foo: 'bar' });
      expect(response.isUnderQuery).to.equal(false);
    });

    test('the response includes the required lines', async () => {
      expect(response.requiredLines).to.equal([
        {
          startDate: '2020-04-01',
          endDate: '2020-04-30',
          timePeriod: 'month'
        },
        {
          startDate: '2020-05-01',
          endDate: '2020-05-31',
          timePeriod: 'month'
        }
      ]);
    });
  });

  experiment('.postReturn', () => {
    beforeEach(async () => {
      apiConnector.persistReturnData.resolves({
        version: {
          version_id: versionId,
          version_number: 1
        }
      });

      request = {
        payload: {
          returnId,
          licenceNumber: '01/123',
          status: 'due',
          receivedDate: '2020-10-01',
          underQuery: false,
          user: {
            type: 'internal',
            email: 'mail@example.com',
            entityId: uuid()
          }
        }
      };
      response = await controller.postReturn(request);
    });

    test('the returns data is persisted using the api connector', async () => {
      expect(apiConnector.persistReturnData.calledWith(request.payload)).to.be.true();
    });

    test('a submission event is recorded', async () => {
      const [evt] = eventsService.update.lastCall.args;
      expect(evt.licences).to.equal(['01/123']);
      expect(evt.type).to.equal('return');
      expect(evt.subtype).to.equal('internal');
      expect(evt.issuer).to.equal('mail@example.com');
      expect(evt.entities).to.equal([request.payload.user.entityId]);
      expect(evt.metadata.returnId).to.equal(returnId);
      expect(evt.metadata.versionId).to.equal(versionId);
      expect(evt.metadata.return).to.equal(request.payload);
      expect(evt.metadata.receivedDate).to.equal(request.payload.receivedDate);
      expect(evt.metadata.underQuery).to.equal(request.payload.underQuery);
      expect(evt.status).to.equal(request.payload.status);
    });

    test('the response is the expected shape', async () => {
      expect(response).to.equal({ error: null });
    });
  });

  experiment('.patchReturnHeader', () => {
    beforeEach(async () => {
      apiConnector.patchReturnData.resolves({
        licence_ref: '01/123',
        return_id: returnId,
        status: 'received',
        received_date: '2020-10-01',
        under_query: false
      });

      request = {
        payload: {
          returnId,
          status: 'received',
          receivedDate: '2020-10-01',
          underQuery: false,
          user: {
            type: 'internal',
            email: 'mail@example.com',
            entityId: uuid()
          }
        }
      };
      response = await controller.patchReturnHeader(request);
    });

    test('the returns header is updated using the api connector', async () => {
      expect(apiConnector.patchReturnData.calledWith(request.payload)).to.be.true();
    });

    test('a submission event is recorded', async () => {
      const [evt] = eventsService.update.lastCall.args;
      expect(evt.licences).to.equal(['01/123']);
      expect(evt.type).to.equal('return.status');
      expect(evt.subtype).to.equal('internal');
      expect(evt.issuer).to.equal('mail@example.com');
      expect(evt.entities).to.equal([request.payload.user.entityId]);
      expect(evt.metadata.returnId).to.equal(returnId);
      expect(evt.metadata.receivedDate).to.equal(request.payload.receivedDate);
      expect(evt.metadata.underQuery).to.equal(request.payload.underQuery);
      expect(evt.status).to.equal(request.payload.status);
    });

    test('the response is the expected shape', async () => {
      expect(response).to.equal({
        returnId,
        status: 'received',
        receivedDate: '2020-10-01',
        isUnderQuery: false
      });
    });
  });

  experiment('.getIncompleteReturns', () => {
    beforeEach(async () => {
      request = {
        query: {
          licenceNumbers: ['01/123/abc', '01/456/ABC', '01/123/ABC']
        }
      };
    });

    experiment('when not all the licences are found', () => {
      beforeEach(async () => {
        licencesService.getLicencesByLicenceRefs.resolves([
          new Licence().fromHash({ licenceNumber: '01/123/ABC' })
        ]);
        response = await controller.getIncompleteReturns(request);
      });

      test('the unique upper-cased licences are fetched from the licences service', async () => {
        const [licenceNumbers] = licencesService.getLicencesByLicenceRefs.lastCall.args;
        expect(licenceNumbers).to.only.include(['01/123/ABC', '01/456/ABC']);
      });

      test('the returns service is not called', async () => {
        expect(returnsService.getReturnsWithContactsForLicence.callCount).to.equal(0);
      });

      test('resolves with a Boom 404 error, including the licence numbers not found', async () => {
        expect(response.isBoom).to.be.true();
        expect(response.output.statusCode).to.equal(404);
        expect(response.output.payload.validationDetails).to.equal({
          licenceNumbers: ['01/456/ABC']
        });
      });
    });

    experiment('when all the licences are found', () => {
      beforeEach(async () => {
        licencesService.getLicencesByLicenceRefs.resolves([
          new Licence().fromHash({ licenceNumber: '01/123/ABC' }),
          new Licence().fromHash({ licenceNumber: '01/456/ABC' })
        ]);
        response = await controller.getIncompleteReturns(request);
      });

      test('the unique upper-cased licences are fetched from the licences service', async () => {
        const [licenceNumbers] = licencesService.getLicencesByLicenceRefs.lastCall.args;
        expect(licenceNumbers).to.only.include(['01/123/ABC', '01/456/ABC']);
      });

      test('the returns service is called to get due returns for each licence', async () => {
        expect(returnsService.getReturnsWithContactsForLicence.callCount).to.equal(2);
        expect(returnsService.getReturnsWithContactsForLicence.calledWith(
          '01/123/ABC'
        )).to.be.true();
        expect(returnsService.getReturnsWithContactsForLicence.calledWith(
          '01/456/ABC'
        )).to.be.true();
      });
    });
  });
});
