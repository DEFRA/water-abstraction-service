const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');

const BillingVolume = require('../../../../src/lib/models/billing-volume');
const billingVolumesRepo = require('../../../../src/lib/connectors/repos/billing-volumes');
const { NotFoundError } = require('../../../../src/lib/errors');
const { BillingVolumeStatusError } = require('../../../../src/modules/billing/lib/errors');
const mappers = require('../../../../src/modules/billing/mappers');
const twoPartTariffMatching = require('../../../../src/modules/billing/services/two-part-tariff-service');
const { createBillingVolume, createUser, createBatch, createFinancialYear } = require('../test-data/test-billing-data');

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
    sandbox.stub(billingVolumesRepo, 'findByChargeElementIdsAndFinancialYear');
    sandbox.stub(billingVolumesRepo, 'create');
    sandbox.stub(billingVolumesRepo, 'update');
    sandbox.stub(mappers.billingVolume, 'dbToModel');
    sandbox.stub(twoPartTariffMatching, 'calculateVolumes');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getVolumes', () => {
    experiment('when calculated volumes exist', () => {
      let billingVolumesData, result, batch;

      beforeEach(async () => {
        billingVolumesData = [
          createBillingVolumeData(1, 2019, true),
          createBillingVolumeData(2, 2019, true)
        ];
        const chargeElements = [
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' }];
        batch = createBatch({ id: batchId });

        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves(billingVolumesData);

        mappers.billingVolume.dbToModel
          .onFirstCall().returns(createBillingVolume(billingVolumesData[0]))
          .onSecondCall().returns(createBillingVolume(billingVolumesData[1]));

        result = await billingVolumesService.getVolumes(chargeElements, '12/34/567', 2019, true, batch);
      });

      test('calls repo.findByChargeElementIdsAndFinancialYear() with charge element ids', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('calls mapper with billing volumes to be returned', async () => {
        expect(mappers.billingVolume.dbToModel.calledWith(
          billingVolumesData[0]
        )).to.be.true();
      });

      test('only returns volumes relevant to financial year and season', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
        expect(result[0].financialYear.yearEnding).to.equal(2019);
        expect(result[0].isSummer).to.be.true();

        expect(result[1]).to.be.instanceOf(BillingVolume);
        expect(result[1].chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
        expect(result[1].financialYear.yearEnding).to.equal(2019);
        expect(result[1].isSummer).to.be.true();
      });
    });

    experiment('when no billing volumes are found in db', () => {
      let chargeElements, result, batch;

      const matchingResults = {
        error: null,
        data: [{
          error: null,
          data: {
            chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1',
            actualReturnQuantity: 25
          }
        }, {
          error: 30,
          data: {
            chargeElementId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2',
            actualReturnQuantity: 60
          }
        }]
      };

      const billingVolumesData = [
        createBillingVolumeData(1, 2019, true, {
          calculatedVolume: 25,
          twoPartTariffStatus: null,
          twoPartTariffError: false,
          isApproved: false
        }),
        createBillingVolumeData(2, 2019, true, {
          calculatedVolume: 60,
          twoPartTariffStatus: 30,
          twoPartTariffError: true,
          isApproved: false
        })
      ];

      beforeEach(async () => {
        chargeElements = [
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' }];

        batch = createBatch({ id: batchId });

        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves([]);

        twoPartTariffMatching.calculateVolumes.resolves(matchingResults);
        billingVolumesRepo.create
          .onFirstCall().resolves(billingVolumesData[0])
          .onSecondCall().resolves(billingVolumesData[1]);

        mappers.billingVolume.dbToModel
          .onFirstCall().returns(createBillingVolume(billingVolumesData[0]))
          .onSecondCall().returns(createBillingVolume(billingVolumesData[1]));

        result = await billingVolumesService.getVolumes(chargeElements, '12/34/567', 2019, true, batch);
      });

      test('calls repo.findByChargeElementIdsAndFinancialYear() with correct params', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('calls two part tariff matching algorithm with correct params', async () => {
        expect(twoPartTariffMatching.calculateVolumes.calledWith(
          chargeElements,
          '12/34/567',
          2019,
          true
        )).to.be.true();
      });

      test('calls repo.create() to persist each volume', async () => {
        expect(billingVolumesRepo.create.callCount).to.equal(2);
      });

      experiment('calls repo.create() with correct data', () => {
        test('first call', async () => {
          const [firstCall] = billingVolumesRepo.create.firstCall.args;
          expect(firstCall.chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1');
          expect(firstCall.financialYear).to.equal(2019);
          expect(firstCall.isSummer).to.equal(true);
          expect(firstCall.calculatedVolume).to.equal(25);
          expect(firstCall.twoPartTariffStatus).to.equal(null);
          expect(firstCall.twoPartTariffError).to.equal(false);
          expect(firstCall.isApproved).to.equal(false);
        });

        test('second call', async () => {
          const [secondCall] = billingVolumesRepo.create.secondCall.args;
          expect(secondCall.chargeElementId).to.equal('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
          expect(secondCall.financialYear).to.equal(2019);
          expect(secondCall.isSummer).to.equal(true);
          expect(secondCall.calculatedVolume).to.equal(60);
          expect(secondCall.twoPartTariffStatus).to.equal(30);
          expect(secondCall.twoPartTariffError).to.equal(true);
          expect(secondCall.isApproved).to.equal(false);
        });
      });

      test('calls mapper for each billing volume to be returned', async () => {
        const [{ chargeElementId: firstChargeElementId }] = mappers.billingVolume.dbToModel.firstCall.args;
        const [{ chargeElementId: secondChargeElementId }] = mappers.billingVolume.dbToModel.secondCall.args;
        expect(mappers.billingVolume.dbToModel.callCount).to.equal(2);
        expect(firstChargeElementId).to.equal(billingVolumesData[0].chargeElementId);
        expect(secondChargeElementId).to.equal(billingVolumesData[1].chargeElementId);
      });

      test('returns BillingVolume models', async () => {
        expect(result[0]).to.be.instanceOf(BillingVolume);
        expect(result[0].chargeElementId).to.equal(billingVolumesData[0].chargeElementId);
        expect(result[1]).to.be.instanceOf(BillingVolume);
        expect(result[1].chargeElementId).to.equal(billingVolumesData[1].chargeElementId);
      });
    });

    experiment('when some billing volumes are missing', () => {
      let chargeElements, batch;

      beforeEach(async () => {
        const billingVolumes = [
          createBillingVolumeData(1, 2019, true)
        ];
        chargeElements = [
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', season: 'summer' },
          { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', season: 'summer' }];

        batch = createBatch({ id: batchId });

        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves(billingVolumes);

        try {
          await billingVolumesService.getVolumes(chargeElements, '12/34/567', 2019, true, batch);
        } catch (err) {}
      });

      test('calls repo.findByChargeElementIdsAndFinancialYear() with correct params', async () => {
        const [chargeElementIds, financialYear] = billingVolumesRepo.findByChargeElementIdsAndFinancialYear.lastCall.args;
        expect(chargeElementIds).to.equal(['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2']);
        expect(financialYear).to.equal(2019);
      });

      test('an error is thrown ', async () => {
        try {
          await billingVolumesService.getVolumes(chargeElements, '12/34/567', 2019, true, batch);
        } catch (err) {
          expect(err).to.be.instanceOf(NotFoundError);
          expect(err.message).to.equal('Billing volumes missing for charge elements bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1,bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2');
        }
      });
    });
  });

  experiment('.updateBillingVolume', () => {
    let batch, billingVolumeData;
    beforeEach(async () => {
      batch = createBatch({ id: batchId, isSummer: true, endYear: createFinancialYear(2019) });
      billingVolumeData = createBillingVolumeData(1, 2019, true);
      billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves([billingVolumeData]);
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
        billingVolumesRepo.update.resolves({ ...billingVolumeData, ...billingVolumeChanges });
      });

      experiment('and the volume is approved', () => {
        test('throws a BillingVolumeStatusError', async () => {
          billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves([{ ...billingVolumeData, isApproved: true }]);
          try {
            await billingVolumesService.updateBillingVolume(billingVolumeData.chargeElementId, batch, 43.7, user);
          } catch (err) {
            expect(err).to.be.instanceOf(BillingVolumeStatusError);
            expect(err.message).to.equal('Approved billing volumes cannot be edited');
          }
        });
      });

      experiment('and the volume is not approved', () => {
        beforeEach(async () => {
          await billingVolumesService.updateBillingVolume(billingVolumeData.chargeElementId, batch, 43.7, user);
        });
        test('calls billingVolumesRepo to get relevant record', async () => {
          expect(billingVolumesRepo.findByChargeElementIdsAndFinancialYear.calledWith(
            [billingVolumeData.chargeElementId], 2019
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
          expect(mappers.billingVolume.dbToModel.calledWith({
            ...billingVolumeData, ...billingVolumeChanges
          })).to.be.true();
        });
      });
    });

    experiment('when the billing volume does not exists', async () => {
      beforeEach(async () => {
        billingVolumesRepo.findByChargeElementIdsAndFinancialYear.resolves([]);
      });
      test('does not call the billingVolumesRepo and throws a NotFoundError', async () => {
        try {
          const batch = createBatch({ id: batchId, isSummer: true, endYear: createFinancialYear(2019) });
          const user = createUser({ id: '1234', email: 'user@example.com' });
          await billingVolumesService.updateBillingVolume('test-charge-element-id', batch, 43.7, user);
        } catch (err) {
          expect(billingVolumesRepo.update.called).to.be.false();

          const errMsg = 'Billing volume not found for chargeElementId test-charge-element-id, financialYear 2019 and isSummer true';
          expect(err).to.be.instanceOf(NotFoundError);
          expect(err.message).to.equal(errMsg);
        }
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

  experiment('.getVolumesWithTwoPartError', () => {
    let batch, volumesForBatch, result;
    beforeEach(async () => {
      batch = createBatch({ id: batchId });
      volumesForBatch = [
        { billingVolumeId: 'test-billing-volume-1', twoPartTariffError: false },
        { billingVolumeId: 'test-billing-volume-2', twoPartTariffError: true }];
      billingVolumesRepo.findByBatchId.resolves(volumesForBatch);
      result = await billingVolumesService.getVolumesWithTwoPartError(batch);
    });

    test('calls billingVolumesRepo with batch id', async () => {
      expect(billingVolumesRepo.findByBatchId.calledWith(
        batchId
      )).to.be.true();
    });

    test('returns the only the results of the DB call with have a TPT error', async () => {
      expect(result).to.equal([volumesForBatch[1]]);
    });
  });

  experiment('.approveVolumesForBatch', () => {
    let batch;
    beforeEach(async () => {
      batch = createBatch({ id: batchId });
      billingVolumesRepo.getUnapprovedVolumesForBatch.resolves([
        { billingVolumeId: 'billing-volume-1' },
        { billingVolumeId: 'billing-volume-2' }
      ]);
      await billingVolumesService.approveVolumesForBatch(batch);
    });
    test('calls billingVolumesRepo with batch id', async () => {
      expect(billingVolumesRepo.getUnapprovedVolumesForBatch.calledWith(
        batchId
      )).to.be.true();
    });

    test('calls repo.update for each row', async () => {
      const firstCallArgs = billingVolumesRepo.update.firstCall.args;
      const secondCallArgs = billingVolumesRepo.update.secondCall.args;
      expect(firstCallArgs[0]).to.equal('billing-volume-1');
      expect(firstCallArgs[1]).to.equal({ isApproved: true });
      expect(secondCallArgs[0]).to.equal('billing-volume-2');
      expect(secondCallArgs[1]).to.equal({ isApproved: true });
    });
  });
});
