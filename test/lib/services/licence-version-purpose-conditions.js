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

const lvpcService = require('../../../src/lib/services/licence-version-purpose-conditions');
const lvpcRepo = require('../../../src/lib/connectors/repos/licence-version-purpose-conditions');

experiment('src/lib/services/licence-version-purpose-conditions', () => {
  beforeEach(async () => {
    sandbox.stub(lvpcRepo, 'findOneById');
    sandbox.stub(lvpcRepo, 'findManyByLicenceId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicenceVersionConditionById', () => {
    const tempGuid = uuid();
    experiment('when the LVPC is found', () => {
      beforeEach(async () => {
        lvpcRepo.findOneById.resolves();
        await lvpcService.getLicenceVersionConditionById(tempGuid);
      });

      test('calls repo.findOneById with supplied ID', async () => {
        const [id] = lvpcRepo.findOneById.lastCall.args;
        expect(id).to.equal(tempGuid);
      });
    });
  });

  experiment('.getLicenceVersionPurposeConditionsByLicenceId', () => {
    const tempGuid = uuid();
    experiment('when the licence is found', () => {
      beforeEach(async () => {
        lvpcRepo.findManyByLicenceId.resolves([]);
        await lvpcService.getLicenceVersionPurposeConditionsByLicenceId(tempGuid);
      });

      test('calls repo.findManyByLicenceId() with supplied licence ID', async () => {
        const [id] = lvpcRepo.findManyByLicenceId.lastCall.args;
        expect(id).to.equal(tempGuid);
      });
    });
  });
});
