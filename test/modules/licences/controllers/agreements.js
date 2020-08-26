'use strict';

const { expect } = require('@hapi/code');
const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const uuid = require('uuid/v4');

const controller = require('../../../../src/modules/licences/controllers/agreements');
const licencesService = require('../../../../src/lib/services/licences');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/licences.js', () => {
  beforeEach(async () => {
    sandbox.stub(licencesService, 'getLicenceAgreementById');
    sandbox.stub(licencesService, 'getLicenceById');
    sandbox.stub(licencesService, 'getLicenceAgreementsByLicenceRef');
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
});
