'use strict';

const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');

const controller = require('../../../../src/modules/licences/controllers/agreements');
const eventsService = require('../../../../src/lib/services/events');
const licencesService = require('../../../../src/lib/services/licences');

const sandbox = require('sinon').createSandbox();

const responseStub = {
  code: sandbox.stub()
};

const h = {
  response: sandbox.stub().returns(responseStub)
};

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licencesService, 'getLicenceAgreementById');
    sandbox.stub(licencesService, 'getLicenceById');
    sandbox.stub(licencesService, 'getLicenceAgreementsByLicenceRef');
    sandbox.stub(licencesService, 'deleteLicenceAgreementById');
    sandbox.stub(eventsService, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAgreement', () => {
    let request;
    let result;
    let agreementId;

    beforeEach(async () => {
      agreementId = uuid();
      request = {
        params: {
          agreementId
        }
      };
    });

    experiment('when the agreement exists', () => {
      beforeEach(async () => {
        licencesService.getLicenceAgreementById.resolves({ agreementId });
        result = await controller.getAgreement(request);
      });

      test('the agreement ID is passed to the service', async () => {
        expect(licencesService.getLicenceAgreementById.calledWith(agreementId)).to.be.true();
      });

      test('resolves with the expected data', async () => {
        expect(result.agreementId).to.equal(agreementId);
      });
    });

    experiment('when the licence does not exist', () => {
      beforeEach(async () => {
        licencesService.getLicenceAgreementById.resolves(null);
        result = await controller.getAgreement(request);
      });

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });
  });

  experiment('.getLicenceAgreements', () => {
    let request;
    let result;

    experiment('when no licence exists for the id', () => {
      beforeEach(async () => {
        request = {
          params: {
            licenceId: uuid()
          }
        };

        licencesService.getLicenceById.resolves(null);

        result = await controller.getLicenceAgreements(request);
      });

      test('no call is made to get the agreements', async () => {
        expect(licencesService.getLicenceAgreementsByLicenceRef.called).to.equal(false);
      });

      test('resolves with a Boom 404', async () => {
        expect(result.isBoom).to.be.true();
        expect(result.output.statusCode).to.equal(404);
      });
    });

    experiment('when there is a licence for the id', () => {
      let licenceAgreementId;

      beforeEach(async () => {
        request = {
          params: {
            licenceId: uuid()
          }
        };

        licencesService.getLicenceById.resolves({
          licenceNumber: '123/123'
        });

        licencesService.getLicenceAgreementsByLicenceRef.resolves([
          { licenceAgreementId: licenceAgreementId = uuid() }
        ]);

        result = await controller.getLicenceAgreements(request);
      });

      test('the agreements are returned', async () => {
        expect(result).equal([
          { licenceAgreementId }
        ]);
      });
    });
  });

  experiment('.deleteAgreement', () => {
    let request, agreementId;
    beforeEach(() => {
      agreementId = uuid();
      request = {
        params: {
          agreementId
        },
        defra: {
          internalCallingUser: {
            email: 'test@example.com'
          }
        }
      };
    });

    experiment('when the agreement is not found', () => {
      let result;
      beforeEach(async () => {
        licencesService.getLicenceAgreementById.resolves(null);
        result = await controller.deleteAgreement(request, h);
      });

      test('the service is not called to delete the agreement', () => {
        expect(licencesService.deleteLicenceAgreementById.called).to.be.false();
      });

      test('no event is logged', () => {
        expect(eventsService.create.called).to.be.false();
      });

      test('no event is logged', () => {
        expect(eventsService.create.called).to.be.false();
      });

      test('the error is returned', () => {
        expect(result.isBoom).to.be.true();
        expect(result.message).to.equal(`Agreement ${agreementId} not found`);
        expect(result.output.payload.error).to.equal('Not Found');
      });
    });

    experiment('when the agreement exists', () => {
      beforeEach(async () => {
        licencesService.getLicenceAgreementById.resolves({ agreementId });
        await controller.deleteAgreement(request, h);
      });

      test('gets the agreement', async () => {
        expect(licencesService.getLicenceAgreementById.calledWith(agreementId)).to.be.true();
      });

      test('deletes the agreement', async () => {
        expect(licencesService.deleteLicenceAgreementById.calledWith(agreementId)).to.be.true();
      });

      experiment('the logged event contains', () => {
        let event;
        beforeEach(() => {
          event = eventsService.create.lastCall.args[0];
        });

        test('the correct type', async () => {
          expect(event.type).to.equal('licence-agreement:delete');
        });

        test('null subtype', async () => {
          expect(event.subtype).to.be.null();
        });

        test('no licences', async () => {
          expect(event.licences).to.equal([]);
        });

        test('the correct status', async () => {
          expect(event.status).to.equal('delete');
        });

        test('the correct issuer', async () => {
          expect(event.issuer).to.equal('test@example.com');
        });

        test('the correct metadata', async () => {
          expect(event.metadata).to.equal({ licenceAgreement: { agreementId } });
        });
      });

      test('responds with a 204', async () => {
        expect(responseStub.code.calledWith(204)).to.be.true();
      });
    });
  });
});
