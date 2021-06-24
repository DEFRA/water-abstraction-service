const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const uuid = require('uuid/v4');

const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const chargeVersionService = require('../../../../src/lib/services/charge-versions');

const Batch = require('../../../../src/lib/models/batch');
const BillingVolume = require('../../../../src/lib/models/billing-volume');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const ChargeElement = require('../../../../src/lib/models/charge-element');
const ChargeVersion = require('../../../../src/lib/models/charge-version');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const billingVolumesRepo = require('../../../../src/lib/connectors/repos/billing-volumes');
const chargePeriod = require('../../../../src/modules/billing/lib/charge-period');
const { NotFoundError } = require('../../../../src/lib/errors');
const { BillingVolumeStatusError } = require('../../../../src/modules/billing/lib/errors');
const { createUser, createBatch, createFinancialYear } = require('../test-data/test-billing-data');

const batchId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

const createBillingVolumeData = (idSuffix, financialYear, isSummer, data = {}) => ({
  billingVolumeId: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa${idSuffix}`,
  chargeElementId: `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb${idSuffix}`,
  financialYear,
  isSummer,
  ...data
});

experiment('modules/billing/services/billing-volumes-service', () => {
  beforeEach(async () => {
    sandbox.stub(billingVolumesRepo, 'getUnapprovedVolumesForBatch');
    sandbox.stub(billingVolumesRepo, 'findByBatchId');
    sandbox.stub(billingVolumesRepo, 'create');
    sandbox.stub(billingVolumesRepo, 'update');
    sandbox.stub(billingVolumesRepo, 'updateByBatchId');
    sandbox.stub(billingVolumesRepo, 'findApprovedByChargeElementIdsAndFinancialYear').resolves([]);
    sandbox.stub(billingVolumesRepo, 'findByIds').resolves([]);
    sandbox.stub(billingVolumesRepo, 'findByBatchIdAndLicenceId').resolves();
    sandbox.stub(billingVolumesRepo, 'findByChargeVersionFinancialYearAndSeason').resolves([]);

    sandbox.stub(chargeVersionService, 'getByChargeVersionId');

    sandbox.stub(chargePeriod, 'getChargePeriod');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getVolumesForChargeElements', () => {
    const tempId = uuid();
    beforeEach(async () => {
      await billingVolumesService.getVolumesForChargeElements([{ id: tempId }], { endYear: '2020' });
    });

    test('calls volumes repo findApprovedByChargeElementIdsAndFinancialYear', () => {
      expect(billingVolumesRepo.findApprovedByChargeElementIdsAndFinancialYear.called).to.be.true();
    });

    test('calls with the right params', () => {
      const params = billingVolumesRepo.findApprovedByChargeElementIdsAndFinancialYear.lastCall.args;
      expect(params).to.equal([[tempId], '2020']);
    });
  });

  experiment('.getBillingVolumesByChargeVersion', () => {
    const tempId = uuid();
    beforeEach(async () => {
      await billingVolumesService.getBillingVolumesByChargeVersion(tempId, { endYear: '2020' }, false);
    });

    test('calls billing volumes repo findByChargeVersionFinancialYearAndSeason', () => {
      expect(billingVolumesRepo.findByChargeVersionFinancialYearAndSeason.called).to.be.true();
    });

    test('uses the right params', () => {
      const params = billingVolumesRepo.findByChargeVersionFinancialYearAndSeason.lastCall.args;
      expect(params).to.equal([tempId, '2020', false]);
    });
  });

  experiment('.updateBillingVolume', () => {
    let batch, billingVolumeData;
    beforeEach(async () => {
      batch = createBatch({ id: batchId, isSummer: true, endYear: createFinancialYear(2019) });
      billingVolumeData = createBillingVolumeData(1, 2019, true);
    });

    experiment('when the billing volume exists', () => {
      let billingVolumeChanges, user;
      beforeEach(async () => {
        user = createUser({ id: '1234', email: 'user@example.com' });
        billingVolumeChanges = {
          volume: 43.7,
          twoPartTariffError: false,
          twoPartTariffReview: {
            id: user.id,
            email: user.email
          }
        };
        billingVolumesRepo.findByIds.resolves([billingVolumeData]);
        billingVolumesRepo.update.resolves({ ...billingVolumeData, ...billingVolumeChanges });
      });

      experiment('and the volume is approved', () => {
        test('throws a BillingVolumeStatusError', async () => {
          billingVolumesRepo.findByIds.resolves([{ ...billingVolumeData, isApproved: true }]);

          const func = () => billingVolumesService.updateBillingVolume(billingVolumeData.chargeElementId, batch, 43.7, user);
          const err = await expect(func()).to.reject();

          expect(err).to.be.instanceOf(BillingVolumeStatusError);
          expect(err.message).to.equal('Approved billing volumes cannot be edited');
        });
      });

      experiment('and the volume is not approved', () => {
        let result;

        beforeEach(async () => {
          billingVolumesRepo.findByIds.resolves([{ ...billingVolumeData, isApproved: false }]);
          result = await billingVolumesService.updateBillingVolume(billingVolumeData.billingVolumeId, 43.7, user);
        });
        test('calls billingVolumesRepo to get relevant record', async () => {
          expect(billingVolumesRepo.findByIds.calledWith(
            [billingVolumeData.billingVolumeId]
          )).to.be.true();
        });

        test('calls repo.update() with the billingVolumeId', () => {
          const [billingVolumeId] = billingVolumesRepo.update.lastCall.args;
          expect(billingVolumeId).to.equal(billingVolumeData.billingVolumeId);
        });

        test('maps the changes correctly', () => {
          const [, changes] = billingVolumesRepo.update.lastCall.args;
          expect(changes).to.equal(billingVolumeChanges);
        });

        test('returns the billingVolume mapped to model', () => {
          expect(result instanceof BillingVolume).to.be.true();
        });
      });
    });

    experiment('when the billing volume does not exists', () => {
      beforeEach(async () => {
        billingVolumesRepo.findByIds.resolves([]);
      });
      test('does not call the billingVolumesRepo and throws a NotFoundError', async () => {
        const user = createUser({ id: '1234', email: 'user@example.com' });
        const func = () => billingVolumesService.updateBillingVolume('test-billing-volume-id', 43.7, user);
        const err = await expect(func()).to.reject();
        expect(err).to.be.instanceOf(NotFoundError);
        expect(err.message).to.equal('Billing volume test-billing-volume-id not found');
      });
    });
  });

  experiment('.getUnapprovedVolumesForBatchCount', () => {
    let batch, result;
    beforeEach(async () => {
      batch = createBatch({ id: batchId });
      billingVolumesRepo.getUnapprovedVolumesForBatch.resolves([{ foo: 'bar' }, { foo: 'baz' }]);
      result = await billingVolumesService.getUnapprovedVolumesForBatchCount(batch);
    });
    test('calls billingVolumesRepo with batch id', async () => {
      expect(billingVolumesRepo.getUnapprovedVolumesForBatch.calledWith(
        batchId
      )).to.be.true();
    });

    test('returns the length of the results of the DB call', async () => {
      expect(result).to.equal(2);
    });
  });

  experiment('.getVolumesForBatch', () => {
    let batch, volumesForBatch, result;
    beforeEach(async () => {
      batch = createBatch({ id: batchId });
      volumesForBatch = [{ billingVolumeId: 'test-billing-volume-1' }, { billingVolumeId: 'test-billing-volume-2' }];
      billingVolumesRepo.findByBatchId.resolves(volumesForBatch);
      result = await billingVolumesService.getVolumesForBatch(batch);
    });
    test('calls billingVolumesRepo with batch id', async () => {
      expect(billingVolumesRepo.findByBatchId.calledWith(
        batchId
      )).to.be.true();
    });

    test('returns the results of the DB call', async () => {
      expect(result).to.equal(volumesForBatch);
    });
  });

  experiment('.approveVolumesForBatch', () => {
    let batch, err;

    beforeEach(async () => {
      batch = createBatch({ id: batchId });
    });

    experiment('when there are unapproved volumes', () => {
      beforeEach(async () => {
        billingVolumesRepo.findByBatchId.resolves([
          { billingVolumeId: 'billing-volume-1', twoPartTariffError: true },
          { billingVolumeId: 'billing-volume-2' }
        ]);
        const func = () => billingVolumesService.approveVolumesForBatch(batch);
        err = await expect(func()).to.reject();
      });

      test('gets billing volumes using the batch ID', async () => {
        expect(billingVolumesRepo.findByBatchId.calledWith(
          batchId
        )).to.be.true();
      });

      test('throws an error', async () => {
        expect(err).to.be.instanceOf(BillingVolumeStatusError);
      });

      test('does not update the billing volumes in the batc', async () => {
        expect(billingVolumesRepo.updateByBatchId.called).to.be.false();
      });
    });

    experiment('when there are no unapproved volumes', () => {
      beforeEach(async () => {
        billingVolumesRepo.findByBatchId.resolves([
          { billingVolumeId: 'billing-volume-1' },
          { billingVolumeId: 'billing-volume-2' }
        ]);
        await billingVolumesService.approveVolumesForBatch(batch);
      });

      test('gets billing volumes using the batch ID', async () => {
        expect(billingVolumesRepo.findByBatchId.calledWith(
          batchId
        )).to.be.true();
      });

      test('updates the billing volumes in the batch', async () => {
        expect(billingVolumesRepo.updateByBatchId.calledWith(
          batch.id, { isApproved: true }
        )).to.be.true();
      });
    });
  });

  experiment('.persist', () => {
    let result;
    const billingVolume = new BillingVolume();

    const data = {
      chargeElementId: uuid(),
      billingBatchId: uuid(),
      calculatedVolume: 5.5,
      volume: 5.5,
      twoPartTariffError: true,
      twoPartTariffStatus: 10,
      financialYear: 2020,
      isSummer: true,
      twoPartTariffReview: null,
      isApproved: false
    };

    billingVolume.fromHash({
      ...data,
      financialYear: new FinancialYear(data.financialYear)
    });

    beforeEach(async () => {
      billingVolumesRepo.create.resolves({
        billingVolumeId: uuid(),
        ...data
      });

      result = await billingVolumesService.persist(billingVolume);
    });

    test('the repo .create() method is called with the correct arguments', async () => {
      const [arg] = billingVolumesRepo.create.lastCall.args;
      expect(arg).to.equal(data);
    });

    test('the result is the saved billingVolume', async () => {
      expect(result).to.be.instanceOf(BillingVolume);
      expect(result.id).to.have.length(36);
    });
  });

  experiment('.getLicenceBillingVolumes', () => {
    const batch = new Batch(uuid());
    const licenceId = uuid();

    beforeEach(async () => {
      billingVolumesRepo.findByBatchIdAndLicenceId.resolves([
        {
          billingVolumeId: 'test-id-1'
        }, {
          billingVolumeId: 'test-id-2'
        }
      ]);
      await billingVolumesService.getLicenceBillingVolumes(batch, licenceId);
    });

    test('the billing volumes for this batch and licence are found', async () => {
      expect(billingVolumesRepo.findByBatchIdAndLicenceId.calledWith(
        batch.id, licenceId
      )).to.be.true();
    });

    test('the full billing volume data structure is loaded from the repo', async () => {
      expect(billingVolumesRepo.findByIds.calledWith([
        'test-id-1', 'test-id-2'
      ])).to.be.true();
    });
  });

  experiment('.getBillingVolumeChargePeriod', () => {
    const chargeVersionId = uuid();
    const invoiceAccountId = uuid();
    const financialYear = new FinancialYear(2021);
    const billingVolume = new BillingVolume().fromHash({
      financialYear
    });
    billingVolume.chargeElement = new ChargeElement().fromHash({
      chargeVersionId
    });
    const chargeVersion = new ChargeVersion(chargeVersionId);
    const invoiceAccount = new InvoiceAccount(invoiceAccountId);

    beforeEach(async () => {
      chargeVersion.invoiceAccount = invoiceAccount;
      chargeVersionService.getByChargeVersionId.resolves(chargeVersion);
      await billingVolumesService.getBillingVolumeChargePeriod(billingVolume);
    });

    test('gets the charge version linked to this billing volume', async () => {
      expect(chargeVersionService.getByChargeVersionId.calledWith(
        chargeVersionId
      )).to.be.true();
    });

    test('gets the charge period', async () => {
      expect(chargePeriod.getChargePeriod.calledWith(
        financialYear, chargeVersion
      )).to.be.true();
    });
  });
});
