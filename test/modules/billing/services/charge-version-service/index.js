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

const repos = require('../../../../../src/lib/connectors/repos');
const chargeVersionYearService = require('../../../../../src/modules/billing/services/charge-version-year');
const chargeVersionService = require('../../../../../src/modules/billing/services/charge-version-service');
const twoPartTariffSeasonsService = require('../../../../../src/modules/billing/services/charge-version-service/two-part-tariff-seasons');
const batchService = require('../../../../../src/modules/billing/services/batch-service');

const Batch = require('../../../../../src/lib/models/batch');
const FinancialYear = require('../../../../../src/lib/models/financial-year');
const Region = require('../../../../../src/lib/models/region');
const DateRange = require('../../../../../src/lib/models/date-range');
const LicenceAgreement = require('../../../../../src/lib/models/licence-agreement');
const { TRANSACTION_TYPE } = require('../../../../../src/lib/models/charge-version-year');
const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants');

const licenceId = 'licence-id';
const chargeVersionId = uuid();
const licenceAgreementId = uuid();

const createChargeVersionRow = (options = {}, finYearEnding = 2022) => {
  const licenceAgreement = new LicenceAgreement(licenceAgreementId); 
  licenceAgreement.fromHash({
    startDate: '2017-04-01',
    endDate: null,
    dateDeleted: null
  });
    
  return {
    chargeVersionId,
    licenceId,
    licence: {
      licenceAgreements: [licenceAgreement]
    },
    includeInSupplementaryBilling: false,
    isTwoPartTariff: false,
    startDate: `${finYearEnding - 1}-04-01`,
    endDate: `${finYearEnding}-03-31`,
    ...options
  };
};

const createBatch = (type, isSummer = false) => new Batch().fromHash({
  type,
  startYear: new FinancialYear(type === Batch.BATCH_TYPE.supplementary ? 2021 : 2022),
  endYear: new FinancialYear(2022),
  region: new Region(uuid()),
  isSummer
});

experiment('modules/billing/services/charge-version-service', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(repos.chargeVersions, 'findValidInRegionAndFinancialYear');
    sandbox.stub(chargeVersionYearService, 'createBatchChargeVersionYear');
    sandbox.stub(repos.chargeVersions, 'findOne').resolves({});
    sandbox.stub(batchService, 'getSentTptBatchesForFinancialYearAndRegion').resolves([{ type: 'two_part_tariff', isSummer: true }, { type: 'two_part_tariff', isSummer: false }]);

    sandbox.stub(twoPartTariffSeasonsService, 'getTwoPartTariffSeasonsForChargeVersion').resolves({
      [RETURN_SEASONS.summer]: true,
      [RETURN_SEASONS.winterAllYear]: true
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createForBatch', () => {
    experiment('for an annual bill run', () => {
      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          createChargeVersionRow()
        ]);

        batch = createBatch(Batch.BATCH_TYPE.annual);

        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true();
      });

      test('creates expected charge version years', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
      });
    });

    experiment('for a winter/all year TPT bill run', () => {
      const chargeVersionRow = createChargeVersionRow();

      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          chargeVersionRow
        ]);

        batch = createBatch(Batch.BATCH_TYPE.twoPartTariff);

        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true();
      });

      test('calls the TPT service with the charge version row', async () => {
        expect(twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.calledWith(
          chargeVersionRow
        )).to.be.true();
      });

      test('creates the charge version year relating to the batch', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, false
        )).to.be.true();
      });
    });

    experiment('for a summer TPT bill run', () => {
      const chargeVersionRow = createChargeVersionRow();

      beforeEach(async () => {
        repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
          chargeVersionRow
        ]);

        batch = createBatch(Batch.BATCH_TYPE.twoPartTariff, true);

        await chargeVersionService.createForBatch(batch);
      });

      test('gets the charge versions in the financial year', async () => {
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(1);
        expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
          batch.region.id, 2022
        )).to.be.true();
      });

      test('calls the TPT service with the charge version row', async () => {
        expect(twoPartTariffSeasonsService.getTwoPartTariffSeasonsForChargeVersion.calledWith(
          chargeVersionRow
        )).to.be.true();
      });

      test('creates the charge version year relating to the batch', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, true
        )).to.be.true();
      });
    });

    experiment('for a supplementary bill run', () => {
      beforeEach(async () => {
        batch = createBatch(Batch.BATCH_TYPE.supplementary);
      });

      experiment('when the licence is not flagged for supplementary billing', () => {
        const chargeVersionRows = [
          createChargeVersionRow({
            includeInSupplementaryBilling: false
          }, 2021),
          createChargeVersionRow({
            includeInSupplementaryBilling: false
          }, 2022)
        ];

        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
            chargeVersionRows[0]
          ]);
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
            chargeVersionRows[1]
          ]);
          await chargeVersionService.createForBatch(batch);
        });

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when the licence is flagged for supplementary billing', () => {
        const chargeVersionRows = [
          createChargeVersionRow({
            includeInSupplementaryBilling: true
          }, 2021),
          createChargeVersionRow({
            includeInSupplementaryBilling: true
          }, 2022)
        ];

        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
            chargeVersionRows[0]
          ]);
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
            chargeVersionRows[1]
          ]);
          repos.chargeVersions.findOne.resolves(createChargeVersionRow());

          await chargeVersionService.createForBatch(batch);
        });

        test('creates the expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(6);
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.annual, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true();
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true();
        });
      });
    });
  });
});
