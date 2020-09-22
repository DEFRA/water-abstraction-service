'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const sandbox = require('sinon').createSandbox();

const errors = require('../../../src/lib/errors');

// Services
const licenceService = require('../../../src/lib/services/licences');
const licenceAgreementsService = require('../../../src/lib/services/licence-agreements');
const eventsService = require('../../../src/lib/services/events');
const service = require('../../../src/lib/services/service');

// Mappers
const licenceAgreementMapper = require('../../../src/lib/mappers/licence-agreement');

// Repos
const licenceAgreementsRepo = require('../../../src/lib/connectors/repos/licence-agreements');

// Models
const User = require('../../../src/lib/models/user');
const Licence = require('../../../src/lib/models/licence');
const LicenceAgreement = require('../../../src/lib/models/licence-agreement');

const licenceAgreementId = uuid();
const createTestUser = () => new User(123, 'joan.doe@example.com');
const createTestLicence = () => new Licence(uuid()).fromHash({
  licenceNumber: '01/123/ABC'
});
const createTestLicenceAgreement = () => new LicenceAgreement(licenceAgreementId).fromHash({
  licenceNumber: '01/123/ABC'
});

experiment('src/lib/services/licence-agreements', () => {
  beforeEach(async () => {
    sandbox.stub(licenceService, 'flagForSupplementaryBilling');
    sandbox.stub(licenceService, 'getLicenceByLicenceRef');

    sandbox.stub(eventsService, 'create');

    sandbox.stub(service, 'findOne');
    sandbox.stub(service, 'findMany');

    sandbox.stub(licenceAgreementsRepo, 'deleteOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicenceAgreementsByLicenceRef', () => {
    test('delegates to service.findMany', async () => {
      await licenceAgreementsService.getLicenceAgreementsByLicenceRef('123/123');
      expect(service.findMany.calledWith(
        '123/123',
        licenceAgreementsRepo.findByLicenceRef,
        licenceAgreementMapper
      )).to.be.true();
    });
  });

  experiment('.getLicenceAgreementById', () => {
    const licenceAgreementId = uuid();

    test('delegates to service.findOne', async () => {
      await licenceAgreementsService.getLicenceAgreementById(licenceAgreementId);
      expect(service.findOne.calledWith(
        licenceAgreementId,
        licenceAgreementsRepo.findOne,
        licenceAgreementMapper
      )).to.be.true();
    });
  });

  experiment('.deleteLicenceAgreementById', () => {
    experiment('when the licence agreement is not found', () => {
      beforeEach(async () => {
        service.findOne.resolves(null);
      });

      test('a NotFoundError is thrown', async () => {
        const func = () => licenceAgreementsService.deleteLicenceAgreementById(licenceAgreementId);
        const err = await expect(func()).to.reject();
        expect(err).to.be.an.instanceof(errors.NotFoundError);
        expect(err.message).to.equal(`Licence agreement ${licenceAgreementId} not found`);
      });
    });

    experiment('when the licence agreement is found', () => {
      let licenceAgreement, user, licence;

      beforeEach(async () => {
        licenceAgreement = createTestLicenceAgreement();
        service.findOne.resolves(licenceAgreement);

        user = createTestUser();

        licence = createTestLicence();
        licenceService.getLicenceByLicenceRef.resolves(licence);

        await licenceAgreementsService.deleteLicenceAgreementById(licenceAgreementId, user);
      });

      test('the record is deleted', async () => {
        expect(licenceAgreementsRepo.deleteOne.calledWith(
          licenceAgreementId
        )).to.be.true();
      });

      test('an event is saved', async () => {
        const [event] = eventsService.create.lastCall.args;
        expect(event.licences).to.equal([licence.licenceNumber]);
        expect(event.issuer).to.equal(user.email);
        expect(event.type).to.equal('licence-agreement:delete');
        expect(event.status).to.equal('deleted');
        expect(event.metadata.id).to.equal(licenceAgreementId);
      });

      test('the licence is flagged for supplementary billing', async () => {
        expect(licenceService.flagForSupplementaryBilling.calledWith(
          licence.id
        )).to.be.true();
      });
    });
  });
});
