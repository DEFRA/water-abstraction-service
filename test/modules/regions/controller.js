'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('../../../src/modules/regions/controller');
const regionsRepo = require('../../../src/lib/connectors/repos/regions');

experiment('modules/regions/controller', () => {
  beforeEach(async () => {
    sandbox.stub(regionsRepo, 'find').resolves([
      {
        regionId: '00000000-0000-0000-0000-000000000000',
        chargeRegionId: 'A',
        naldRegionId: 1,
        name: 'Anglian',
        dateCreated: '2019-10-01 11:22:33.456789',
        dateUpdated: '2019-10-01 11:22:33.456789'
      }
    ]
    );
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getRegions', () => {
    test('calls the find function of regions repo', async () => {
      await controller.getRegions();
      expect(regionsRepo.find.called).to.be.true();
    });

    test('returns the expected response', async () => {
      const response = await controller.getRegions();
      expect(response).to.equal({
        data: [
          {
            regionId: '00000000-0000-0000-0000-000000000000',
            chargeRegionId: 'A',
            naldRegionId: 1,
            name: 'Anglian',
            dateCreated: '2019-10-01 11:22:33.456789',
            dateUpdated: '2019-10-01 11:22:33.456789'
          }
        ]
      });
    });
  });
});
