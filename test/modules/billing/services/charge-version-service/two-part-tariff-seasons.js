'use strict';

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sandbox = require('sinon').createSandbox();

const repos = require('../../../../../src/lib/connectors/repos');
const returnRequirementVersionService = require('../../../../../src/lib/services/return-requirement-versions');

const twoPartTariffSeasons = require('../../../../../src/modules/billing/services/charge-version-service/two-part-tariff-seasons');

const Batch = require('../../../../../src/lib/models/batch');
const DateRange = require('../../../../../src/lib/models/date-range');
const ReturnRequirementVersion = require('../../../../../src/lib/models/return-requirement-version');

const { RETURN_SEASONS } = require('../../../../../src/lib/models/constants');

const licenceId = 'licence-id';
const chargeVersionId = 'test-charge-version-id';

const createReturnVersion = (startDate, endDate, isSummer = true, isWinterAllYear = true) => {
  const returnVersion = new ReturnRequirementVersion();
  sandbox.stub(returnVersion, 'hasTwoPartTariffPurposeReturnsInSeason');

  returnVersion.hasTwoPartTariffPurposeReturnsInSeason.withArgs(
    RETURN_SEASONS.summer
  ).returns(isSummer);

  returnVersion.hasTwoPartTariffPurposeReturnsInSeason.withArgs(
    RETURN_SEASONS.winterAllYear
  ).returns(isWinterAllYear);

  sandbox.stub(returnVersion, 'isNotDraft').returns(true);
  return returnVersion.fromHash({
    dateRange: new DateRange(startDate, endDate)
  });
};

experiment('modules/billing/services/charge-version-service/two-part-tariff-seasons', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(repos.billingVolumes, 'findByChargeVersionAndFinancialYear');
    sandbox.stub(returnRequirementVersionService, 'getByLicenceId');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getTwoPartTariffSeasonsForChargeVersion', () => {
    experiment('when the isTwoPartTariff flag is false', () => {
      const chargeVersionRow = {
        isTwoPartTariff: false,
        chargeVersionId,
        startDate: '2019-04-01',
        endDate: '2020-03-01'
      };

      beforeEach(async () => {
        result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
      });

      test('resolves with both season flags false', async () => {
        expect(result).to.equal({
          summer: false,
          winterAllYear: false
        });
      });
    });

    experiment('for pre-financial year ending 2021', () => {
      const chargeVersionRow = {
        isTwoPartTariff: true,
        chargeVersionId,
        startDate: '2019-04-01',
        endDate: '2020-03-01'
      };

      experiment('when an approved summer NALD billing volume is found', () => {
        beforeEach(async () => {
          repos.billingVolumes.findByChargeVersionAndFinancialYear.resolves([{
            source: Batch.BATCH_SOURCE.nald,
            isSummer: true,
            isApproved: true
          }]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.calledWith(
            chargeVersionId, 2020
          )).to.be.true();
        });

        test('return requirememts are not fetched', async () => {
          expect(returnRequirementVersionService.getByLicenceId.called).to.be.false();
        });

        test('resolved with only the summer season flag set', async () => {
          expect(result).to.equal({
            summer: true,
            winterAllYear: false
          });
        });
      });

      experiment('when an approved winter/all year NALD billing volume is found', () => {
        beforeEach(async () => {
          repos.billingVolumes.findByChargeVersionAndFinancialYear.resolves([{
            source: Batch.BATCH_SOURCE.nald,
            isSummer: false,
            isApproved: true
          }]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.calledWith(
            chargeVersionId, 2020
          )).to.be.true();
        });

        test('return requirememts are not fetched', async () => {
          expect(returnRequirementVersionService.getByLicenceId.called).to.be.false();
        });

        test('resolved with only the winter/all year season flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: true
          });
        });
      });
    });

    experiment('for financial year ending 2021', () => {
      const chargeVersionRow = {
        licenceId,
        isTwoPartTariff: true,
        chargeVersionId,
        startDate: '2020-04-01',
        endDate: '2021-03-01'
      };

      experiment('when an approved summer NALD billing volume is found', () => {
        beforeEach(async () => {
          repos.billingVolumes.findByChargeVersionAndFinancialYear.resolves([{
            source: Batch.BATCH_SOURCE.nald,
            isSummer: true,
            isApproved: true
          }]);
          returnRequirementVersionService.getByLicenceId.resolves([]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.calledWith(
            chargeVersionId, 2021
          )).to.be.true();
        });

        test('return requirememts are fetched by licence ID', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('resolved with only the summer season flag set', async () => {
          expect(result).to.equal({
            summer: true,
            winterAllYear: false
          });
        });
      });

      experiment('when a return version is found indicating winter/all year returns only', () => {
        beforeEach(async () => {
          repos.billingVolumes.findByChargeVersionAndFinancialYear.resolves([]);
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2000-01-01', null, false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.calledWith(
            chargeVersionId, 2021
          )).to.be.true();
        });

        test('return requirememts are fetched by licence ID', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('resolves with only the winter/all year season flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: true
          });
        });
      });

      experiment('when a billing volume is found indicating summer return and return version is found indicating winter/all year only', () => {
        beforeEach(async () => {
          repos.billingVolumes.findByChargeVersionAndFinancialYear.resolves([{
            source: Batch.BATCH_SOURCE.nald,
            isSummer: true,
            isApproved: true
          }]);
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2000-01-01', null, false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.calledWith(
            chargeVersionId, 2021
          )).to.be.true();
        });

        test('return requirememts are fetched by licence ID', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('resolves with only the winter/all year season flag set', async () => {
          expect(result).to.equal({
            summer: true,
            winterAllYear: true
          });
        });
      });
    });

    experiment('for financial year ending 2022', () => {
      const chargeVersionRow = {
        licenceId,
        isTwoPartTariff: true,
        chargeVersionId,
        startDate: '2021-04-01',
        endDate: '2022-03-01'
      };

      experiment('when no return versions are found', () => {
        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('billing volumes are not fetched', async () => {
          expect(repos.billingVolumes.findByChargeVersionAndFinancialYear.called).to.be.false();
        });

        test('return requirememts are fetched by licence ID', async () => {
          expect(returnRequirementVersionService.getByLicenceId.calledWith(
            licenceId
          )).to.be.true();
        });

        test('resolves with both season flags set to false', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: false
          });
        });
      });

      experiment('when a return version is found indicating winter/all year returns', () => {
        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2000-01-01', null, false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('resolves with only the winter/all year season flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: true
          });
        });
      });

      experiment('when a return version is found and partially overlaps the charge period', () => {
        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2000-01-01', '2021-04-01', false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('resolves with only the winter/all year season flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: true
          });
        });
      });

      experiment('when a return version is found and does not overlap the charge period', () => {
        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-01-01', '2021-03-31', false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow);
        });

        test('resolves with neither flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: false
          });
        });
      });

      experiment('when existing batches are supplied in both seasons', () => {
        const existingTPTBatches = [{
          isSummer: true
        }, {
          isSummer: false
        }];

        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-01-01', null, true, false),
            createReturnVersion('2021-01-01', null, false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow, existingTPTBatches);
        });

        test('resolves with both flags set', async () => {
          expect(result).to.equal({
            summer: true,
            winterAllYear: true
          });
        });
      });

      experiment('when existing batches are supplied in neither season', () => {
        const existingTPTBatches = [];

        beforeEach(async () => {
          returnRequirementVersionService.getByLicenceId.resolves([
            createReturnVersion('2021-01-01', null, true, false),
            createReturnVersion('2021-01-01', null, false, true)
          ]);
          result = await twoPartTariffSeasons.getTwoPartTariffSeasonsForChargeVersion(chargeVersionRow, existingTPTBatches);
        });

        test('resolves with neither flag set', async () => {
          expect(result).to.equal({
            summer: false,
            winterAllYear: false
          });
        });
      });
    });
  });
});
