'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const Batch = require('../../../../src/lib/models/batch');
const Decimal = require('decimal.js-light');
const repos = require('../../../../src/lib/connectors/repos');

const licencesService = require('../../../../src/modules/billing/services/licences-service');
const invoiceAccountService = require('../../../../src/lib/services/invoice-accounts-service');
const generalLicencesService = require('../../../../src/lib/services/licences');
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const { BatchStatusError } = require('../../../../src/modules/billing/lib/errors');

experiment('modules/billing/services/licences-service', () => {
  let batch, result;

  beforeEach(async () => {
    batch = new Batch();

    sandbox.stub(repos.licences, 'findByBatchIdForTwoPartTariffReview');
    sandbox.stub(generalLicencesService, 'flagForSupplementaryBilling');

    sandbox.stub(repos.billingVolumes, 'deleteByBatchIdAndLicenceId');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'deleteByBatchIdAndLicenceId');
    sandbox.stub(billingVolumesService, 'getLicenceBillingVolumes').resolves([{ calculatedVolume: new Decimal(10), volume: 100 }]);
    sandbox.stub(invoiceAccountService, 'getByInvoiceAccountIds').resolves([{ id: 'test-invoice-account-id', company: { name: 'test company name' } }]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByBatchIdForTwoPartTariffReview', () => {
    const dbResults = [{
      licenceId: uuid(),
      licenceRef: '01/123',
      twoPartTariffErrors: [true, false, false, true],
      twoPartTariffStatuses: [10, null, null, 10, 20],
      returnVolumeEdited: 1,
      invoiceAccountId: 'test-invoice-account-id'
    }];

    beforeEach(async () => {
      repos.licences.findByBatchIdForTwoPartTariffReview.resolves(dbResults);
      result = await licencesService.getByBatchIdForTwoPartTariffReview(batch.id);
    });

    test('calls the licences repo method with the batch ID', async () => {
      expect(repos.licences.findByBatchIdForTwoPartTariffReview.calledWith(
        batch.id
      )).to.be.true();
    });

    test('the results are correctly mapped', async () => {
      expect(result).to.equal([{
        licenceId: dbResults[0].licenceId,
        licenceRef: dbResults[0].licenceRef,
        twoPartTariffError: true,
        twoPartTariffStatuses: [10, 20],
        billingContact: 'test company name',
        billingVolumeEdited: true
      }]);
    });
  });

  experiment('.deleteBatchLicence', () => {
    const licenceId = uuid();

    experiment('when batch status is not "review"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.ready;
      });

      test('an error is thrown', async () => {
        const func = () => licencesService.deleteBatchLicence(batch, licenceId);
        const err = await expect(func()).to.reject();
        expect(err).instanceOf(BatchStatusError);
      });
    });

    experiment('when batch status is "review"', () => {
      beforeEach(async () => {
        batch.status = Batch.BATCH_STATUS.review;
        await licencesService.deleteBatchLicence(batch, licenceId);
      });

      test('billing volumes relating to the licence are removed from the batch', async () => {
        expect(repos.billingVolumes.deleteByBatchIdAndLicenceId.calledWith(
          batch.id, licenceId
        )).to.be.true();
        expect(repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId.calledWith(
          batch.id, licenceId
        )).to.be.true();
      });

      test('licence is flagged for supplementary billing', async () => {
        expect(generalLicencesService.flagForSupplementaryBilling.calledWith(
          licenceId
        )).to.be.true();
      });

      test('the methods are called in the correct order', async () => {
        sinon.assert.callOrder(
          repos.billingVolumes.deleteByBatchIdAndLicenceId,
          repos.billingBatchChargeVersionYears.deleteByBatchIdAndLicenceId,
          generalLicencesService.flagForSupplementaryBilling
        );
      });
    });
  });
});
