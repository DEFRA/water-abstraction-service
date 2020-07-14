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
const regionsService = require('../../../src/lib/services/regions-service');
const regionsRepo = require('../../../src/lib/connectors/repos/regions');
const { NotFoundError } = require('../../../src/lib/errors');

experiment('modules/billing/services/regions-service', () => {
  let regionId, region, response;
  beforeEach(async () => {
    regionId = uuid();
    region = {
      regionId,
      chargeRegionId: 'N'
    };
    sandbox.stub(regionsRepo, 'findOne').resolves(region);

    response = await regionsService.getRegionCode(regionId);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getRegionCode', () => {
    test('passes the region id to the repo', async () => {
      expect(regionsRepo.findOne.calledWith(
        regionId
      )).to.be.true();
    });

    test('returns the region code', async () => {
      expect(response).to.equal(region.chargeRegionId);
    });

    test('if no region is found, throws a NotFoundError', async () => {
      regionsRepo.findOne.resolves(null);
      try {
        response = await regionsService.getRegionCode(regionId);
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError);
        expect(err.message).to.equal(`Region ${regionId} not found`);
      }
    });
  });
});
