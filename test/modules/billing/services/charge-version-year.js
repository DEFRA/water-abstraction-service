'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const repos = require('../../../../src/lib/connectors/repos');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const chargeProcessorService = require('../../../../src/modules/billing/services/charge-processor-service');
const Batch = require('../../../../src/lib/models/batch');
const { TRANSACTION_TYPE } = require('../../../../src/lib/models/charge-version-year');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const Invoice = require('../../../../src/lib/models/invoice');

const TEST_ID = uuid();

experiment('modules/billing/services/charge-version-year', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersionYears, 'update').resolves();
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findStatusCountsByBatchId');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findByBatchId');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findTwoPartTariffByBatchId');
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create');

    sandbox.stub(batchService, 'getBatchById').resolves(new Batch());
    sandbox.stub(chargeProcessorService, 'processChargeVersionYear').resolves(new Invoice());
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setReadyStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setReadyStatus(TEST_ID);
    });

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args;
      expect(id).to.equal(TEST_ID);
      expect(data).to.equal({
        status: 'ready'
      });
    });
  });

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setErrorStatus(TEST_ID);
    });

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args;
      expect(id).to.equal(TEST_ID);
      expect(data).to.equal({
        status: 'error'
      });
    });
  });

  experiment('.getStatusCounts', () => {
    let result;
    const batchId = 'test-batch-id';

    experiment('when no rows found in batch', () => {
      beforeEach(async () => {
        repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.resolves([]);
        result = await chargeVersionYearService.getStatusCounts(batchId);
      });

      test('the repo .findStatusCountsByBatchId() method is called with the correct batch ID', async () => {
        expect(
          repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.calledWith(batchId)
        ).to.be.true();
      });

      test('zeros are returned for all statuses', async () => {
        expect(result).to.equal({
          ready: 0,
          error: 0,
          processing: 0
        });
      });
    });

    experiment('when rows found in batch', () => {
      beforeEach(async () => {
        repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.resolves([
          { status: 'ready', count: '3' },
          { status: 'error', count: '9' }
        ]);
        result = await chargeVersionYearService.getStatusCounts(batchId);
      });

      test('counts are returned as integers', async () => {
        expect(result).to.equal({
          ready: 3,
          error: 9,
          processing: 0
        });
      });
    });
  });

  experiment('.processChargeVersionYear', () => {
    let result;

    beforeEach(async () => {
      result = await chargeVersionYearService.processChargeVersionYear({
        billing_batch_id: 'test-batch-id',
        charge_version_id: 'test-charge-version-id',
        financial_year_ending: 2020
      });
    });

    test('the batch is loaded', async () => {
      expect(batchService.getBatchById.calledWith('test-batch-id')).to.be.true();
    });

    test('the charge processor is invoked', async () => {
      const [batch, financialYear, chargeVersionId] = chargeProcessorService.processChargeVersionYear.lastCall.args;
      expect(batch instanceof Batch).to.be.true();
      expect(financialYear instanceof FinancialYear).to.be.true();
      expect(financialYear.yearEnding).to.equal(2020);
      expect(chargeVersionId).to.equal('test-charge-version-id');
    });

    test('the batch is decorated with the invoice', async () => {
      expect(result.invoices[0] instanceof Invoice).to.be.true();
    });
  });

  experiment('.getForBatch', () => {
    beforeEach(async () => {
      await chargeVersionYearService.getForBatch('test-id');
    });

    test('calls the underlying repo method', async () => {
      expect(repos.billingBatchChargeVersionYears.findByBatchId.calledWith('test-id')).to.be.true();
    });
  });

  experiment('.getTwoPartTariffForBatch', () => {
    beforeEach(async () => {
      await chargeVersionYearService.getTwoPartTariffForBatch('test-id');
    });

    test('calls the underlying repo method', async () => {
      expect(repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId.calledWith('test-id')).to.be.true();
    });
  });

  experiment('.createBatchChargeVersionYear', () => {
    let batch, financialYear, transactionType, isSummer;
    const chargeVersionId = uuid();

    beforeEach(async () => {
      batch = new Batch(uuid());
      financialYear = new FinancialYear(2020);
      transactionType = 'annual';
      isSummer = false;
      await chargeVersionYearService.createBatchChargeVersionYear(batch, chargeVersionId, financialYear, transactionType, isSummer);
    });

    test('calls the repo method to create the record', async () => {
      const [batchId, id, endYear, status, txnType, isSummer] = repos.billingBatchChargeVersionYears.create.lastCall.args;
      expect(batchId).to.equal(batch.id);
      expect(id).to.equal(chargeVersionId);
      expect(endYear).to.equal(2020);
      expect(status).to.equal(Batch.BATCH_STATUS.processing);
      expect(txnType).to.equal(TRANSACTION_TYPE.annual);
      expect(isSummer).to.be.false();
    });
  });
});
