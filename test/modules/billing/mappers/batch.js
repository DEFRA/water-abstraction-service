const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const batchMapper = require('../../../../src/modules/billing/mappers/batch');
const uuid = require('uuid/v4');

const Batch = require('../../../../src/lib/models/batch');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const Region = require('../../../../src/lib/models/region');
const Totals = require('../../../../src/lib/models/totals');

const data = {
  batch: {
    billingBatchId: uuid(),
    batchType: 'supplementary',
    season: 'summer',
    status: 'processing',
    dateCreated: '2020-02-18T13:54:25+00:00',
    dateUpdated: '2020-02-18T13:54:25+00:00',
    fromFinancialYearEnding: 2019,
    toFinancialYearEnding: 2020,
    region: {
      regionId: uuid(),
      chargeRegionId: 'A',
      name: 'Anglian',
      displayName: 'Anglian'
    },
    externalId: null,
    netTotal: 3552,
    creditNoteCount: 4,
    invoiceCount: 3,
    errorCode: 10
  }
};

experiment('modules/billing/mappers/batch', () => {
  let batch;

  experiment('.dbToModel', () => {
    experiment('when the external ID is null', () => {
      beforeEach(async () => {
        batch = batchMapper.dbToModel(data.batch);
      });

      test('returns a Batch instance', async () => {
        expect(batch instanceof Batch).to.be.true();
      });

      test('scalar properties are mapped correctly', async () => {
        expect(batch.id).to.equal(data.batch.billingBatchId);
        expect(batch.type).to.equal(data.batch.batchType);
        expect(batch.season).to.equal(data.batch.season);
        expect(batch.status).to.equal(data.batch.status);
        expect(batch.dateCreated.format()).to.equal(data.batch.dateCreated);
        expect(batch.dateUpdated.format()).to.equal(data.batch.dateUpdated);
      });

      test('the start year is a FinancialYear instance', async () => {
        expect(batch.startYear instanceof FinancialYear).to.be.true();
        expect(batch.startYear.yearEnding).to.equal(2019);
      });

      test('the end year is a FinancialYear instance', async () => {
        expect(batch.endYear instanceof FinancialYear).to.be.true();
        expect(batch.endYear.yearEnding).to.equal(2020);
      });

      test('the region is a Region instance', async () => {
        expect(batch.region instanceof Region).to.be.true();
      });

      test('externalId is not set', async () => {
        expect(batch.externalId).to.be.undefined();
      });

      test('totals are not set', async () => {
        expect(batch.totals).to.be.undefined();
      });

      test('sets the errorCode property', async () => {
        expect(batch.errorCode).to.equal(10);
      });
    });

    experiment('when the external ID is null', () => {
      beforeEach(async () => {
        batch = batchMapper.dbToModel({
          ...data.batch,
          externalId: 2345
        });
      });

      test('externalId is set', async () => {
        expect(batch.externalId).to.equal(2345);
      });

      test('totals is a Totals instance', async () => {
        expect(batch.totals instanceof Totals).to.be.true();
      });
    });
  });
});
