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
const Region = require('../../../../src/lib/models/region');

const data = {
  dbRow: {
    licence_id: '6e4b0cb8-7d37-4119-be3b-855c6a26b3be',
    licence_ref: '01/123/ABC',
    isWaterUndertaker: false,
    region_id: 'ef627969-9636-4d9c-abc6-ad42f64ec340',
    region_name: 'Anglian',
    charge_region_id: 'A',
    nald_region_id: 1,
    regions: {
      historicalAreaCode: 'ABC',
      regionalChargeArea: 'Anglian'
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

  experiment('.mapDBToModel', () => {
    let result;

    beforeEach(async () => {
      result = licenceService.mapDBToModel(data.dbRow);
    });

    test('returns a Licence instance', async () => {
      expect(result instanceof Licence).to.be.true();
    });

    test('licence details are mapped correctly', async () => {
      expect(result.id).to.equal(data.dbRow.licence_id);
      expect(result.licenceNumber).to.equal(data.dbRow.licence_ref);
      expect(result.isWaterUndertaker).to.equal(data.dbRow.is_water_undertaker);
    });

    test('includes a NALD region', async () => {
      const { region } = result;
      expect(region instanceof Region);
      expect(region.type).to.equal(Region.types.region);
      expect(region.id).to.equal(data.dbRow.region_id);
      expect(region.name).to.equal(data.dbRow.region_name);
      expect(region.code).to.equal(data.dbRow.charge_region_id);
      expect(region.numericCode).to.equal(data.dbRow.nald_region_id);
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
