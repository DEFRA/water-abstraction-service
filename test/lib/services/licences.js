const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const licencesService = require('../../../src/lib/services/licences');
const repos = require('../../../src/lib/connectors/repos');

// Models
const Licence = require('../../../src/lib/models/licence');

const data = {
  dbRow: {
    licenceId: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
    licenceRef: '01/123/ABC',
    isWaterUndertaker: false,
    regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
    regionName: 'Anglian',
    chargeRegionId: 'A',
    naldRegionId: 1,
    startDate: '2019-01-01',
    expiredDate: null,
    lapsedDate: null,
    revokedDate: null,
    regions: {
      historicalAreaCode: 'ABC',
      regionalChargeArea: 'Anglian'
    },
    region: {
      regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
      name: 'Anglian',
      displayName: 'Anglian',
      chargeRegionId: 'A',
      naldRegionId: 1
    }
  }
};

experiment('src/lib/services/licences', () => {
  beforeEach(async () => {
    sandbox.stub(repos.licences, 'findOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getLicenceById', () => {
    let result;

    experiment('when the licence is found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(data.dbRow);
        result = await licencesService.getLicenceById(data.dbRow.licenceId);
      });

      test('calls repos.licences.findOne() with supplied licence ID', async () => {
        const [id] = repos.licences.findOne.lastCall.args;
        expect(id).to.equal(data.dbRow.licenceId);
      });

      test('returns licence instance', async () => {
        expect(result instanceof Licence).to.be.true();
      });
    });

    experiment('when the licence is not found', () => {
      beforeEach(async () => {
        repos.licences.findOne.resolves(null);
        result = await licencesService.getLicenceById(data.dbRow.licenceId);
      });

      test('resolves with null', async () => {
        expect(result).to.equal(null);
      });
    });
  });
});
