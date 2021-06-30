'use strict';

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const {
  afterEach,
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { logger } = require('../../../../src/logger');
const licenceVersionPurposeConditionsService = require('../../../../src/lib/services/licence-version-purpose-conditions');
const lvpcController = require('../../../../src/modules/licences/controllers/licence-version-purpose-conditions');

const sandbox = require('sinon').createSandbox();

experiment('modules/licences/controllers/licence-version-purpose-conditions', () => {
  beforeEach(async () => {
    sandbox.stub(licenceVersionPurposeConditionsService, 'getLicenceVersionConditionById');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceVersionPurposeConditionById', () => {
    const randomGuid = uuid();
    const request = {
      params: {
        licenceVersionPurposeConditionId: randomGuid
      }
    };

    experiment('when entity is found', () => {
      beforeEach(async () => {
        await licenceVersionPurposeConditionsService.getLicenceVersionConditionById.resolves({
          licenceVersionPurposeConditionId: randomGuid
        });

        await lvpcController.getLicenceVersionPurposeConditionById(request);
      });
      afterEach(() => {
        sandbox.restore();
      });
      test('calls the LVPC service with the correct params', async () => {
        const [id] = licenceVersionPurposeConditionsService.getLicenceVersionConditionById.lastCall.args;
        expect(id).to.equal(randomGuid);
      });
    });

    experiment('when entity is not found', () => {
      let result;
      beforeEach(async () => {
        await licenceVersionPurposeConditionsService.getLicenceVersionConditionById.resolves(null);

        result = await lvpcController.getLicenceVersionPurposeConditionById(request);
      });
      afterEach(() => {
        sandbox.restore();
      });
      test('calls the LVPC service with the correct params', async () => {
        const [id] = licenceVersionPurposeConditionsService.getLicenceVersionConditionById.lastCall.args;
        expect(id).to.equal(randomGuid);
      });

      test('returns a Boom error', async () => {
        expect(result.isBoom).to.be.true();
      });
    });
  });
});
