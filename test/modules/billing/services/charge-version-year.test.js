'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const uuid = require('uuid/v4')

const repos = require('../../../../src/lib/connectors/repos')
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year')
const chargeProcessorService = require('../../../../src/modules/billing/services/charge-processor-service')
const Batch = require('../../../../src/lib/models/batch')
const { TRANSACTION_TYPE } = require('../../../../src/lib/models/charge-version-year')
const FinancialYear = require('../../../../src/lib/models/financial-year')
const Invoice = require('../../../../src/lib/models/invoice')
const ChargeVersionYear = require('../../../../src/lib/models/charge-version-year')

const TEST_ID = uuid()

experiment('modules/billing/services/charge-version-year', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findOne').resolves()
    sandbox.stub(repos.billingBatchChargeVersionYears, 'update').resolves()
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findStatusCountsByBatchId')
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findByBatchId')
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findTwoPartTariffByBatchId')
    sandbox.stub(repos.billingBatchChargeVersionYears, 'create')

    sandbox.stub(chargeProcessorService, 'processChargeVersionYear').resolves(new Invoice())
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getChargeVersionYearById', () => {
    let result
    beforeEach(async () => {
      result = await chargeVersionYearService.getChargeVersionYearById(TEST_ID)
    })

    test('calls repo findOne() method with correct arguments', async () => {
      const [id] = repos.billingBatchChargeVersionYears.findOne.lastCall.args
      expect(id).to.equal(TEST_ID)
    })

    test('returns null when no charge version year found', async () => {
      expect(result).to.equal(null)
    })

    test('returns a ChargeVersionYear instance when record found', async () => {
      repos.billingBatchChargeVersionYears.findOne.resolves({
        billingBatchChargeVersionYearId: TEST_ID
      })
      result = await chargeVersionYearService.getChargeVersionYearById(TEST_ID)
      expect(result).to.be.instanceOf(ChargeVersionYear)
      expect(result.id).to.equal(TEST_ID)
    })
  })

  experiment('.setReadyStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setReadyStatus(TEST_ID)
    })

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args
      expect(id).to.equal(TEST_ID)
      expect(data).to.equal({
        status: 'ready'
      })
    })
  })

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setErrorStatus(TEST_ID)
    })

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args
      expect(id).to.equal(TEST_ID)
      expect(data).to.equal({
        status: 'error'
      })
    })
  })

  experiment('.getStatusCounts', () => {
    let result
    const batchId = 'test-batch-id'

    experiment('when no rows found in batch', () => {
      beforeEach(async () => {
        repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.resolves([])
        result = await chargeVersionYearService.getStatusCounts(batchId)
      })

      test('the repo .findStatusCountsByBatchId() method is called with the correct batch ID', async () => {
        expect(
          repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.calledWith(batchId)
        ).to.be.true()
      })

      test('zeros are returned for all statuses', async () => {
        expect(result).to.equal({
          ready: 0,
          error: 0,
          processing: 0
        })
      })
    })

    experiment('when rows found in batch', () => {
      beforeEach(async () => {
        repos.billingBatchChargeVersionYears.findStatusCountsByBatchId.resolves([
          { status: 'ready', count: '3' },
          { status: 'error', count: '9' }
        ])
        result = await chargeVersionYearService.getStatusCounts(batchId)
      })

      test('counts are returned as integers', async () => {
        expect(result).to.equal({
          ready: 3,
          error: 9,
          processing: 0
        })
      })
    })
  })

  experiment('.processChargeVersionYear', () => {
    let result, chargeVersionYear, batch

    beforeEach(async () => {
      chargeVersionYear = new ChargeVersionYear()
      batch = new Batch()
      batch.scheme = 'alcs'
      chargeVersionYear.batch = batch
      chargeVersionYear.isChargeable = true
      result = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear)
    })

    test('the charge processor is invoked', async () => {
      const [cvYear] = chargeProcessorService.processChargeVersionYear.lastCall.args
      expect(cvYear).to.equal(chargeVersionYear)
    })

    test('the charge version year batch is returned', async () => {
      expect(result).to.equal(batch)
    })

    test('the batch is decorated with the invoice', async () => {
      expect(result.invoices[0] instanceof Invoice).to.be.true()
    })
  })

  experiment('.getForBatch', () => {
    beforeEach(async () => {
      await chargeVersionYearService.getForBatch('test-id')
    })

    test('calls the underlying repo method', async () => {
      expect(repos.billingBatchChargeVersionYears.findByBatchId.calledWith('test-id')).to.be.true()
    })
  })

  experiment('.getTwoPartTariffForBatch', () => {
    beforeEach(async () => {
      await chargeVersionYearService.getTwoPartTariffForBatch('test-id')
    })

    test('calls the underlying repo method', async () => {
      expect(repos.billingBatchChargeVersionYears.findTwoPartTariffByBatchId.calledWith('test-id')).to.be.true()
    })
  })

  experiment('.createBatchChargeVersionYear', () => {
    let batch, financialYear
    const testChargeVersionId = uuid()

    beforeEach(async () => {
      batch = new Batch(uuid())
      financialYear = new FinancialYear(2020)
      await chargeVersionYearService.createBatchChargeVersionYear(batch, testChargeVersionId, financialYear, 'annual', false, false)
    })

    test('calls the repo method to create the record', async () => {
      const { billingBatchId, chargeVersionId, financialYearEnding, status, transactionType, isSummer } = repos.billingBatchChargeVersionYears.create.lastCall.args[0]
      expect(billingBatchId).to.equal(batch.id)
      expect(chargeVersionId).to.equal(testChargeVersionId)
      expect(financialYearEnding).to.equal(2020)
      expect(status).to.equal(Batch.BATCH_STATUS.processing)
      expect(transactionType).to.equal(TRANSACTION_TYPE.annual)
      expect(isSummer).to.be.false()
    })
  })
})
