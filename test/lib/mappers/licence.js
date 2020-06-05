const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const licenceMapper = require('../../../src/lib/mappers/licence');

// Models
const Licence = require('../../../src/lib/models/licence');
const Region = require('../../../src/lib/models/region');

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
    lapsedDate: '2020-02-03',
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

experiment('modules/billing/mappers/licence', () => {
  experiment('.dbToModel', () => {
    let result;

    beforeEach(async () => {
      result = licenceMapper.dbToModel(data.dbRow);
    });

    test('returns a Licence instance', async () => {
      expect(result instanceof Licence).to.be.true();
    });

    test('licence details are mapped correctly', async () => {
      expect(result.id).to.equal(data.dbRow.licenceId);
      expect(result.licenceNumber).to.equal(data.dbRow.licenceRef);
      expect(result.isWaterUndertaker).to.equal(data.dbRow.isWaterUndertaker);
    });

    test('licence dates are mapped correctly', async () => {
      expect(result.startDate).to.equal(data.dbRow.startDate);
      expect(result.expiredDate).to.equal(data.dbRow.expiredDate);
      expect(result.lapsedDate).to.equal(data.dbRow.lapsedDate);
      expect(result.revokedDate).to.equal(data.dbRow.revokedDate);
    });

    test('includes a NALD region', async () => {
      const { region } = result;
      expect(region instanceof Region);
      expect(region.type).to.equal(Region.types.region);
      expect(region.id).to.equal(data.dbRow.regionId);
      expect(region.name).to.equal(data.dbRow.regionName);
      expect(region.code).to.equal(data.dbRow.chargeRegionId);
      expect(region.numericCode).to.equal(data.dbRow.naldRegionId);
    });

    test('includes a historical EA area region', async () => {
      const { historicalArea } = result;
      expect(historicalArea instanceof Region);
      expect(historicalArea.type).to.equal(Region.types.environmentAgencyArea);
      expect(historicalArea.code).to.equal(data.dbRow.regions.historicalAreaCode);
    });

    test('includes a regional charge area', async () => {
      const { regionalChargeArea } = result;
      expect(regionalChargeArea instanceof Region);
      expect(regionalChargeArea.type).to.equal(Region.types.regionalChargeArea);
      expect(regionalChargeArea.name).to.equal(data.dbRow.regions.regionalChargeArea);
    });
  });
});
