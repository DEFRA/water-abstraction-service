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

const config = require('../../../../config');

const licenceId = 'licence-id';
const chargeVersionId = 'test-charge-version-id';

const createChargeVersionRow = (options = {}, finYearEnding = 2022) => ({
  chargeVersionId,
  licenceId,
  includeInSupplementaryBilling: false,
  isTwoPartTariff: false,
  startDate: `${finYearEnding - 1}-04-01`,
  endDate: `${finYearEnding}-03-31`,
  ...options
});

const createReturnVersion = (startDate, endDate, hasTwoPartTariffPurposeReturnsInSeason) => {
  const returnVersion = new ReturnRequirementVersion();
  sandbox.stub(returnVersion, 'hasTwoPartTariffPurposeReturnsInSeason').returns(hasTwoPartTariffPurposeReturnsInSeason);
  sandbox.stub(returnVersion, 'isNotDraft').returns(true);
  return returnVersion.fromHash({
    dateRange: new DateRange(startDate, endDate)
  });
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
    sandbox.stub(config.billing, 'naldSwitchOverDate').value('2021-04-01');

    sandbox.stub(repos.chargeVersions, 'findValidInRegionAndFinancialYear');
    sandbox.stub(chargeVersionYearService, 'createBatchChargeVersionYear');

    sandbox.stub(returnRequirementVersionService, 'getByLicenceId');
    sandbox.stub(batchService, 'getSentTptBatchesForFinancialYearAndRegion');
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

      test('does not get the return requirements for the licence', async () => {
        expect(returnRequirementVersionService.getByLicenceId.called).to.be.false();
      });

      test('creates expected charge version years', async () => {
        expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
        expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
          batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.annual, false
        )).to.be.true();
      });
    });

    experiment('for a winter/all year TPT bill run', () => {
      experiment('when there is no TPT agreement', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow()
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

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when the charge version does not have TPT returns in season', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow({
              isTwoPartTariff: true
            })
          ]);

          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-04-01', '2022-03-31', false)
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

        test('gets the return requirements for the licence', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when the charge version has TPT returns in season', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow({
              isTwoPartTariff: true
            })
          ]);

          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-04-01', '2022-03-31', true)
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

        test('gets the return requirements for the licence', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('creates expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, false
          )).to.be.true();
        });
      });
    });

    experiment('for a summer TPT bill run', () => {
      experiment('when there is no TPT agreement', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow()
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

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when the charge version does not have TPT returns in season', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow({
              isTwoPartTariff: true
            })
          ]);

          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-04-01', '2022-03-31', false)
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

        test('gets the return requirements for the licence', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when the charge version has TPT returns in season', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.resolves([
            createChargeVersionRow({
              isTwoPartTariff: true
            })
          ]);

          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-04-01', '2022-03-31', true)
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

        test('gets the return requirements for the licence', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('creates expected charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(1);
          expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
            batch, chargeVersionId, batch.endYear, TRANSACTION_TYPE.twoPartTariff, true
          )).to.be.true();
        });
      });
    });

    experiment('for a supplementary bill run', () => {
      beforeEach(async () => {
        batch = createBatch(Batch.BATCH_TYPE.supplementary);
      });

      experiment('when the licence is not flagged for supplementary billing', () => {
        beforeEach(async () => {
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
            createChargeVersionRow({
              includeInSupplementaryBilling: false
            }, 2021)
          ]);
          repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
            createChargeVersionRow({
              includeInSupplementaryBilling: false
            }, 2022)
          ]);
          await chargeVersionService.createForBatch(batch);
        });

        test('gets the charge versions in the financial years', async () => {
          expect(repos.chargeVersions.findValidInRegionAndFinancialYear.callCount).to.equal(2);
          expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
            batch.region.id, 2021
          )).to.be.true();
          expect(repos.chargeVersions.findValidInRegionAndFinancialYear.calledWith(
            batch.region.id, 2022
          )).to.be.true();
        });

        test('does not get the return requirements for the licence', async () => {
          expect(returnRequirementVersionService.getByLicenceId.called).to.be.false();
        });

        test('creates no charge version years', async () => {
          expect(chargeVersionYearService.createBatchChargeVersionYear.called).to.be.false();
        });
      });

      experiment('when all two-part tariff batches have been run', () => {
        beforeEach(async () => {
          batchService.getSentTptBatchesForFinancialYearAndRegion.withArgs(new FinancialYear(2021), batch.region).resolves([
            {
              endYear: { endYear: 2021 },
              isSummer: false
            }
          ]);
          batchService.getSentTptBatchesForFinancialYearAndRegion.withArgs(new FinancialYear(2022), batch.region).resolves([
            {
              endYear: { endYear: 2021 },
              isSummer: false
            },
            {
              endYear: { endYear: 2021 },
              isSummer: true
            }
          ]);
        });

        experiment('when the licence does not have two-part tariff agreement', () => {
          beforeEach(async () => {
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: false
              }, 2021)
            ]);
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: false
              }, 2022)
            ]);

            await chargeVersionService.createForBatch(batch);
          });

          test('creates expected charge version years for each year', async () => {
            expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(2);
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.annual, false
            )).to.be.true();
          });
        });

        experiment('when the licence has two-part tariff agreement', () => {
          beforeEach(async () => {
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2021)
            ]);
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2022)
            ]);

            returnRequirementVersionService.getByLicenceId.resolves([
              createReturnVersion('2020-04-01', null, true)
            ]);

            await chargeVersionService.createForBatch(batch);
          });

          test('creates expected charge version years for each year', async () => {
            expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(5);
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, false
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

        experiment('when the licence has two-part tariff agreement, but there are no valid return versions', () => {
          beforeEach(async () => {
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2021)
            ]);
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2022)
            ]);

            returnRequirementVersionService.getByLicenceId.resolves([
            ]);

            await chargeVersionService.createForBatch(batch);
          });

          test('creates expected charge version years for each year', async () => {
            expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(3);
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.annual, false
            )).to.be.true();
          });
        });
      });

      experiment('when the winter/all year two-part tariff batch has not yet been run', () => {
        beforeEach(async () => {
          batchService.getSentTptBatchesForFinancialYearAndRegion.withArgs(new FinancialYear(2021), batch.region).resolves([
            {
              endYear: { endYear: 2021 },
              isSummer: false
            }
          ]);
          batchService.getSentTptBatchesForFinancialYearAndRegion.withArgs(new FinancialYear(2022), batch.region).resolves([
            {
              endYear: { endYear: 2021 },
              isSummer: true
            }
          ]);
        });

        experiment('when the licence has two-part tariff agreement', () => {
          beforeEach(async () => {
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2021).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2021)
            ]);
            repos.chargeVersions.findValidInRegionAndFinancialYear.withArgs(batch.region.id, 2022).resolves([
              createChargeVersionRow({
                includeInSupplementaryBilling: true,
                isTwoPartTariff: true
              }, 2022)
            ]);

            returnRequirementVersionService.getByLicenceId.resolves([
              createReturnVersion('2020-04-01', null, true)
            ]);

            await chargeVersionService.createForBatch(batch);
          });

          test('creates expected charge version years for each year', async () => {
            expect(chargeVersionYearService.createBatchChargeVersionYear.callCount).to.equal(4);
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.annual, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2021), TRANSACTION_TYPE.twoPartTariff, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.annual, false
            )).to.be.true();
            expect(chargeVersionYearService.createBatchChargeVersionYear.calledWith(
              batch, chargeVersionId, new FinancialYear(2022), TRANSACTION_TYPE.twoPartTariff, true
            )).to.be.true();
          });
        });
      });
    });
  });
});
