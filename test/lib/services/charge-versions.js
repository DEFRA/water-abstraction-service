'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const service = require('../../../src/lib/services/service');
const chargeVersionService = require('../../../src/lib/services/charge-versions');
const ChargeVersion = require('../../../src/lib/models/charge-version');
const Licence = require('../../../src/lib/models/licence');
const DateRange = require('../../../src/lib/models/date-range');
const Region = require('../../../src/lib/models/region');
const Company = require('../../../src/lib/models/company');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const chargeVersionMapper = require('../../../src/lib/mappers/charge-version');
const chargeVersionRepo = require('../../../src/lib/connectors/repos/charge-versions');

experiment('lib/services/charge-versions', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findOne').resolves('test');
    sandbox.stub(service, 'findMany').resolves('test');
    sandbox.stub(chargeVersionRepo, 'create').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChargeVersionById', () => {
    test('delegates to the service.findOne function', async () => {
      const id = uuid();
      const result = await chargeVersionService.getByChargeVersionId(id);

      expect(result).to.equal('test');

      const [chargeVersionId, fetch, mapper] = service.findOne.lastCall.args;
      expect(chargeVersionId).to.equal(id);
      expect(fetch).to.equal(chargeVersionRepo.findOne);
      expect(mapper).to.equal(chargeVersionMapper);
    });
  });

  experiment('.getByLicenceRef', () => {
    test('delegates to the service.findMany function', async () => {
      const result = await chargeVersionService.getByLicenceRef('123/123');

      expect(result).to.equal('test');

      const [licenceRef, fetch, mapper] = service.findMany.lastCall.args;
      expect(licenceRef).to.equal('123/123');
      expect(fetch).to.equal(chargeVersionRepo.findByLicenceRef);
      expect(mapper).to.equal(chargeVersionMapper);
    });
  });

  experiment('.createChargeVersion', () => {
    let chargeVersion;
    let result;

    beforeEach(async () => {
      chargeVersion = new ChargeVersion(uuid());

      chargeVersion.licence = new Licence().fromHash({
        licenceNumber: '123/123'
      });

      chargeVersion.versionNumber = 100;
      chargeVersion.dateRange = new DateRange('2000-01-01', '2001-01-01');
      chargeVersion.status = ChargeVersion.STATUS.current;
      chargeVersion.apportionment = true;
      chargeVersion.error = true;
      chargeVersion.billedUpToDate = new Date();
      chargeVersion.region = new Region().fromHash({
        numericCode: 1
      });
      chargeVersion.dateCreated = '2000-01-01';
      chargeVersion.dateUpdated = '2000-01-02';
      chargeVersion.company = new Company(uuid());
      chargeVersion.invoiceAccount = new InvoiceAccount(uuid());

      service.findOne.resolves(chargeVersion);
      result = await chargeVersionService.createChargeVersion(chargeVersion);
    });

    test('the mode is mapped to a database entity', async () => {
      const [entity] = chargeVersionRepo.create.lastCall.args;

      expect(entity.chargeVersionId).to.equal(chargeVersion.id);
      expect(entity.licenceRef).to.equal(chargeVersion.licence.licenceNumber);
    });

    test('the source is set to wrls', async () => {
      const [entity] = chargeVersionRepo.create.lastCall.args;

      expect(entity.source).to.equal('wrls');
    });

    test('the full charge version is returned', async () => {
      expect(result).to.equal(chargeVersion);
    });
  });
});
