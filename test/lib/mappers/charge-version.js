'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const ChargeVersion = require('../../../src/lib/models/charge-version');
const Licence = require('../../../src/lib/models/licence');
const DateRange = require('../../../src/lib/models/date-range');
const Region = require('../../../src/lib/models/region');
const Company = require('../../../src/lib/models/company');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const mapper = require('../../../src/lib/mappers/charge-version');

experiment('lib/mappers/charge-version', () => {
  experiment('modelToDb', () => {
    let model;
    let db;

    beforeEach(async () => {
      model = new ChargeVersion(uuid());
      model.licence = new Licence().fromHash({
        licenceNumber: '123/123'
      });
      model.versionNumber = 100;
      model.dateRange = new DateRange('2000-01-01', '2001-01-01');
      model.status = ChargeVersion.STATUS.current;
      model.apportionment = true;
      model.error = true;
      model.billedUpToDate = '2020-02-02';
      model.region = new Region().fromHash({
        numericCode: 1
      });
      model.dateCreated = '2000-01-01';
      model.dateUpdated = '2000-01-02';
      model.source = 'wrls';
      model.company = new Company(uuid());
      model.invoiceAccount = new InvoiceAccount(uuid());
      model.scheme = 'alcs';

      db = mapper.modelToDb(model);
    });

    test('maps the charge version id', async () => {
      expect(db.chargeVersionId).to.equal(model.id);
    });

    test('maps the licence number', async () => {
      expect(db.licenceRef).to.equal(model.licence.licenceNumber);
    });

    test('maps the version number', async () => {
      expect(db.versionNumber).to.equal(model.versionNumber);
    });

    test('maps the start date', async () => {
      expect(db.startDate).to.equal(model.dateRange.startDate);
    });

    test('maps the end date', async () => {
      expect(db.endDate).to.equal(model.dateRange.endDate);
    });

    test('maps the status', async () => {
      expect(db.status).to.equal(model.status);
    });

    test('maps the apportionment', async () => {
      expect(db.apportionment).to.equal(model.apportionment);
    });

    test('maps the error', async () => {
      expect(db.error).to.equal(model.error);
    });

    test('maps the scheme', async () => {
      expect(db.scheme).to.equal(model.scheme);
    });

    test('maps the billed up to date', async () => {
      expect(db.billedUptoDate).to.equal(model.billedUpToDate);
    });

    test('maps the region code', async () => {
      expect(db.regionCode).to.equal(model.region.numericCode);
    });

    test('maps the created date', async () => {
      expect(db.dateCreated).to.equal(model.dateCreated);
    });

    test('maps the updated date', async () => {
      expect(db.dateUpdated).to.equal(model.dateUpdated);
    });

    test('maps the source', async () => {
      expect(db.source).to.equal(model.source);
    });

    test('maps the company id', async () => {
      expect(db.companyId).to.equal(model.company.id);
    });

    test('maps the invoice account id', async () => {
      expect(db.invoiceAccountId).to.equal(model.invoiceAccount.id);
    });
  });
});
