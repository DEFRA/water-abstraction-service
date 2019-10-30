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
const regionsConnector = require('../../../src/lib/connectors/regions');

experiment('modules/regions/controller', () => {
  beforeEach(async () => {
    sandbox.stub(regionsConnector, 'getRegions').resolves({
      data: [
        {
          region_id: '00000000-0000-0000-0000-000000000000',
          charge_region_id: 'A',
          nald_region_id: 1,
          name: 'Anglian',
          date_created: '2019-10-01 11:22:33.456789',
          date_updated: '2019-10-01 11:22:33.456789'
        }
      ]
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getRegions', () => {
    test('calls the getRegions function of regionConnector', async () => {
      await controller.getRegions();
      expect(regionsConnector.getRegions.called).to.be.true();
    });

    test('throws an error if returned from the regionConnector', async () => {
      regionsConnector.getRegions.resolves({
        data: null,
        error: {
          test: true
        }
      });

      await expect(controller.getRegions()).to.reject();
    });

    test('camel cases the response', async () => {
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
