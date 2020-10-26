'use strict';

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const repos = require('../../../../src/lib/connectors/repos');
const returnRequirementVersionService = require('../../../../src/lib/services/return-requirement-versions');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const chargeVersionService = require('../../../../src/modules/billing/services/charge-version-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const Batch = require('../../../../src/lib/models/batch');
const DateRange = require('../../../../src/lib/models/date-range');
const ReturnRequirementVersion = require('../../../../src/lib/models/return-requirement-version');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const Region = require('../../../../src/lib/models/region');
const { TRANSACTION_TYPE } = require('../../../../src/lib/models/charge-version-year');

const chargeVersions = [
  {
    chargeVersionId: 'charge-version-id-1',
    licenceId: 'licence-id-1',
    includeInSupplementaryBilling: false,
    isTwoPartTariff: false,
    startDate: '2020-04-01',
    endDate: '2021-03-31'
  },
  {
    chargeVersionId: 'charge-version-id-2',
    licenceId: 'licence-id-2',
    includeInSupplementaryBilling: true,
    isTwoPartTariff: false,
    startDate: '2020-04-01',
    endDate: '2021-03-31'
  },
  {
    chargeVersionId: 'charge-version-id-3',
    licenceId: 'licence-id-3',
    includeInSupplementaryBilling: false,
    isTwoPartTariff: true,
    startDate: '2020-04-01',
    endDate: '2021-03-31'
  },
  {
    chargeVersionId: 'charge-version-id-4',
    licenceId: 'licence-id-4',
    includeInSupplementaryBilling: false,
    isTwoPartTariff: true,
    startDate: '2020-04-01',
    endDate: '2020-09-30'
  },
  {
    chargeVersionId: 'charge-version-id-5',
    licenceId: 'licence-id-4',
    includeInSupplementaryBilling: false,
    isTwoPartTariff: true,
    startDate: '2020-10-01',
    endDate: '2021-03-31'
  }
];

const createReturnVersion = (startDate, endDate, hasTwoPartTariffPurposeReturnsInSeason) => {
  const returnVersion = new ReturnRequirementVersion();
  sandbox.stub(returnVersion, 'hasTwoPartTariffPurposeReturnsInSeason').returns(hasTwoPartTariffPurposeReturnsInSeason);
  sandbox.stub(returnVersion, 'isNotDraft').returns(true);
  return returnVersion.fromHash({
    dateRange: new DateRange(startDate, endDate)
  });
};

experiment('modules/billing/services/charge-version-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.chargeVersions, 'findValidInRegionAndFinancialYear').resolves(chargeVersions);
    sandbox.stub(repos.billingBatchChargeVersions, 'create');
    sandbox.stub(chargeVersionYearService, 'createBatchChargeVersionYear');

    sandbox.stub(returnRequirementVersionService, 'getByLicenceId');
    sandbox.stub(batchService, 'getSentTptBatchesForFinancialYearAndRegion').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createForBatch', () => {
    let batch;

    beforeEach(async () => {
      batch = new Batch();
    });

    experiment('for an annual batch', () => {
      beforeEach(async () => {
        batch.fromHash({
          endYear: new FinancialYear(2021),
          type: Batch.BATCH_TYPE.annual,
          region: new Region(uuid())
        });
        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2021
        )).to.be.true();
      });

      test('creates expected charge version years', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(5);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-1', batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-2', batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-3', batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-4', batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-5', batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
      });
    });

    experiment('for a supplementary batch', () => {
      beforeEach(async () => {
        batch = new Batch();
        batch.fromHash({
          startYear: new FinancialYear(2019),
          endYear: new FinancialYear(2021),
          type: Batch.BATCH_TYPE.supplementary,
          region: new Region(uuid())
        });
        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(3);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2019
        )).to.be.true();
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2020
        )).to.be.true();
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2021
        )).to.be.true();
      });

      experiment('when no sent TPT batches for region and financial years', () => {
        test('creates expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(3);
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2019), TRANSACTION_TYPE.annual, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2020), TRANSACTION_TYPE.annual, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2021), TRANSACTION_TYPE.annual, false
          )).to.be.true();
        });
      });

      experiment('when sent TPT batches for region and financial years exist', () => {
        beforeEach(async () => {
          batchService.getSentTptBatchesForFinancialYearAndRegion.resolves([{
            endYear: { endYear: 2019 },
            isSummer: true
          }, {
            endYear: { endYear: 2019 },
            isSummer: false
          }]);
          batch.endYear = new FinancialYear(2019);
          await chargeVersionService.createForBatch(batch);
        });

        test('creates expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2019), TRANSACTION_TYPE.annual, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2019), TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, 'charge-version-id-2', new FinancialYear(2019), TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true();
        });
      });
    });

    experiment('for a two-part tariff summer batch', async () => {
      beforeEach(async () => {
        returnRequirementVersionService.getByLicenceId.withArgs('licence-id-3').resolves([
          createReturnVersion('2018-04-01', null, true)
        ]);
        returnRequirementVersionService.getByLicenceId.withArgs('licence-id-4').resolves([
          createReturnVersion('2018-04-01', '2020-09-30', false),
          createReturnVersion('2020-10-01', null, true)
        ]);

        batch = new Batch();
        batch.fromHash({
          endYear: new FinancialYear(2021),
          type: Batch.BATCH_TYPE.twoPartTariff,
          region: new Region(uuid()),
          isSummer: true
        });
        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2021
        )).to.be.true();
      });

      test('creates expected charge version years', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(2);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-3', batch.endYear, TRANSACTION_TYPE.twoPartTariff, true
        )).to.be.true();
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, 'charge-version-id-5', batch.endYear, TRANSACTION_TYPE.twoPartTariff, true
        )).to.be.true();
      });
    });
  });
});
