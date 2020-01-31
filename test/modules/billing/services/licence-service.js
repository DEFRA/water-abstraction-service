const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const licenceService = require('../../../../src/modules/billing/services/licence-service');
const repos = require('../../../../src/lib/connectors/repository');

// Models
const Licence = require('../../../../src/lib/models/licence');

const data = {
  dbRow: {
    licenceId: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
    licenceRef: '01/123/ABC',
    isWaterUndertaker: false,
    regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
    regionName: 'Anglian',
    chargeRegionId: 'A',
    naldRegionId: 1,
    regions: {
      historicalAreaCode: 'ABC',
      regionalChargeArea: 'Anglian'
    },
    region: {
      regionId: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
      name: 'Anglian',
      chargeRegionId: 'A',
      naldRegionId: 1
    }
  }
};

experiment('modules/billing/services/licence-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.licences, 'findOneByLicenceNumber');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByLicenceNumber', () => {
    let result;

    beforeEach(async () => {
      repos.licences.findOneByLicenceNumber.resolves(data.dbRow);
      result = await licenceService.getByLicenceNumber(data.dbRow.licence_ref);
    });

    test('calls repos.licences.findOneByLicenceNumber() with supplied licence number', async () => {
      const [licenceNumber] = repos.licences.findOneByLicenceNumber.lastCall.args;
      expect(licenceNumber).to.equal(data.dbRow.licence_ref);
    });

    test('returns licence instance', async () => {
      expect(result instanceof Licence).to.be.true();
    });
  });
});
