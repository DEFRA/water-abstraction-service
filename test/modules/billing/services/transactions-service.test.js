const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const { v4: uuid } = require('uuid')

const transactionsService = require('../../../../src/modules/billing/services/transactions-service')
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service')
const repos = require('../../../../src/lib/connectors/repos')
const { logger } = require('../../../../src/logger')

const { createTransaction, createInvoiceLicence, createTransactionDBRow, createBatch, createInvoice } = require('../test-data/test-billing-data')

const chargeElementDBData = {
  chargeElementId: 'ae7197b3-a00b-4a49-be36-af63df6f8583',
  source: 'unsupported',
  season: 'winter',
  loss: 'medium',
  abstractionPeriodStartDay: 1,
  abstractionPeriodStartMonth: 4,
  abstractionPeriodEndDay: 31,
  abstractionPeriodEndMonth: 3,
  authorisedAnnualQuantity: 20
}
const transactionDBRow = createTransactionDBRow({ chargeElement: chargeElementDBData })

experiment('modules/billing/services/transactions-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingTransactions, 'create')
    sandbox.stub(repos.billingTransactions, 'update').resolves(transactionDBRow)
    sandbox.stub(repos.billingTransactions, 'delete')
    sandbox.stub(repos.billingTransactions, 'findByBatchId')
    sandbox.stub(repos.billingTransactions, 'findOne')
    sandbox.stub(repos.billingTransactions, 'findHistoryByBatchId').resolves([transactionDBRow])
    sandbox.stub(repos.billingBatchChargeVersionYears, 'findByBatchId')

    sandbox.stub(billingVolumesService, 'getVolumesForBatch')

    sandbox.stub(logger, 'error')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.saveTransactionToDB alcs', () => {
    let invoiceLicence

    beforeEach(async () => {
      invoiceLicence = createInvoiceLicence({ transactions: [createTransaction()] })
      await transactionsService.saveTransactionToDB(invoiceLicence, invoiceLicence.transactions[0])
    })

    test('the create() method is called on the repo', async () => {
      expect(repos.billingTransactions.create.called).to.be.true()
    })

    test('an object of the correct shape is passed to the create() method of the repo', async () => {
      const [data] = repos.billingTransactions.create.lastCall.args
      expect(data).to.be.an.object()
      expect(Object.keys(data)).to.include([
        'billingInvoiceLicenceId',
        'chargeElementId',
        'startDate',
        'endDate',
        'abstractionPeriod',
        'source',
        'season',
        'loss',
        'isCredit',
        'chargeType',
        'authorisedQuantity',
        'billableQuantity',
        'authorisedDays',
        'billableDays',
        'description'
      ])
    })
  })

  experiment('.saveTransactionToDB sroc', () => {
    let invoiceLicence, transaction

    beforeEach(async () => {
      invoiceLicence = { id: 'test-invoice-licence-id' }
      transaction = { scheme: 'sroc' }
      await transactionsService.saveTransactionToDB(invoiceLicence, transaction)
    })

    test('the create() method is called on the repo', async () => {
      expect(repos.billingTransactions.create.called).to.be.true()
    })

    test('the update() method is called on the repo', async () => {
      await transactionsService.saveTransactionToDB(invoiceLicence, { id: 'test-id', ...transaction })
      expect(repos.billingTransactions.update.called).to.be.true()
    })

    test('an object of the correct shape is passed to the create() method of the repo', async () => {
      const [data] = repos.billingTransactions.create.lastCall.args
      expect(data).to.be.an.object()
      expect(data).to.equal({
        billingInvoiceLicenceId: 'test-invoice-licence-id',
        scheme: 'sroc'
      })
    })
  })
  experiment('.getById sroc', () => {
    let result
    beforeEach(async () => {
      repos.billingTransactions.findOne.resolves({ scheme: 'sroc', test: 'data' })
      result = await transactionsService.getById('test-id')
    })

    test('the finOne() method is called on the repo', async () => {
      expect(repos.billingTransactions.findOne.called).to.be.true()
    })
    test('the raw data is returned', async () => {
      expect(result).to.equal({ scheme: 'sroc', test: 'data' })
    })
  })

  experiment('.getById sroc', () => {
    let result
    beforeEach(async () => {
      repos.billingTransactions.findOne.resolves({ scheme: 'sroc', test: 'data' })
      result = await transactionsService.getById('test-id')
    })

    test('the finOne() method is called on the repo', async () => {
      expect(repos.billingTransactions.findOne.called).to.be.true()
    })
    test('the raw data is returned', async () => {
      expect(result).to.equal({ scheme: 'sroc', test: 'data' })
    })
  })

  experiment('.updateTransactionWithChargeModuleResponse', () => {
    const transactionId = uuid()
    const externalId = uuid()

    experiment('when there is a transaction ID', () => {
      beforeEach(async () => {
        await transactionsService.updateWithChargeModuleResponse(transactionId, {
          transaction: {
            id: externalId
          }
        })
      })

      test('the transaction status and external ID are updated', async () => {
        const [id, changes] = repos.billingTransactions.update.lastCall.args
        expect(id).to.equal(transactionId)
        expect(changes).to.equal({
          externalId,
          status: 'charge_created'
        })
      })
    })

    experiment('when there is an unrecognised response', () => {
      const response = {
        message: 'Something strange'
      }

      test('throws an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response)
          fail()
        } catch (err) {
          expect(err instanceof Error).to.be.true()
        }
      })

      test('logs an error', async () => {
        try {
          transactionsService.updateWithChargeModuleResponse(transactionId, response)
          fail()
        } catch (err) {
          const [message, error, params] = logger.error.lastCall.args
          expect(message).to.be.a.string()
          expect(error instanceof Error).to.be.true()
          expect(params).to.equal({
            transactionId,
            response
          })
        }
      })
    })
  })

  experiment('.persistDeMinimis', () => {
    let batch

    beforeEach(async () => {
      batch = createBatch()
      batch.invoices = [
        createInvoice()
      ]
      batch.invoices[0].invoiceLicences[0].transactions = [
        createTransaction({ id: '00000000-0000-0000-0000-000000000000', isDeMinimis: false }),
        createTransaction({ id: '00000000-0000-0000-0000-000000000001', isDeMinimis: true }),
        createTransaction({ id: '00000000-0000-0000-0000-000000000002', isDeMinimis: false }),
        createTransaction({ id: '00000000-0000-0000-0000-000000000003', isDeMinimis: true })
      ]

      await transactionsService.persistDeMinimis(batch)
    })

    test('clears flag for all transactions where isDeMinimis is false', async () => {
      expect(repos.billingTransactions.update.calledWith(
        ['00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000002'], { isDeMinimis: false }
      )).to.be.true()
    })

    test('sets flag for all transactions where isDeMinimis is true', async () => {
      expect(repos.billingTransactions.update.calledWith(
        ['00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003'], { isDeMinimis: true }
      )).to.be.true()
    })
  })

  experiment('.getBatchTransactionHistory', () => {
    let batch, result, chargeVersionYear
    const licenceId = uuid()
    const secondPartTrx = { licenceId, description: 'Second Part Spray', financialYearEnding: 2020, isTwoPartSecondPartCharge: true, startDate: '2019-03-01', endDate: '2020-01-31' }
    const firstPartTrx = { licenceId, description: 'First Part Spray', financialYearEnding: 2020 }
    const normalTrx = { licenceId, description: 'Evaporating Cooling', financialYearEnding: 2020 }
    chargeVersionYear = { chargeVersion: { licenceId }, financialYearEnding: 2019, isChargeable: true }

    experiment('when there are no matching 2PT charge version years', () => {
      beforeEach(async () => {
        batch = createBatch()
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        repos.billingTransactions.findHistoryByBatchId.resolves([firstPartTrx, secondPartTrx, normalTrx])
        result = await transactionsService.getBatchTransactionHistory(batch.id)
      })

      test('all non two part tariff second part transactions are not filtered out', async () => {
        expect(result[0]).to.equal(firstPartTrx)
        expect(result[1]).to.equal(normalTrx)
      })
      test('the second part transactions are filtered out if there is no matching financial year', async () => {
        expect(result.includes(secondPartTrx)).to.be.false()
      })
      test('the second part transactions are filtered out if there is no matching licenceId', async () => {
        chargeVersionYear = { chargeVersion: { licenceId: 'test id' }, financialYearEnding: 2020 }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.false()
      })
      test('the second part transactions are not filtered out if there is matching licenceId and financial year', async () => {
        chargeVersionYear = { chargeVersion: { licenceId }, financialYearEnding: 2020, hasTwoPartAgreement: true, transactionType: 'two_part_tariff', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.true()
      })
      test('the second part transactions are not filtered out if the charge version is non chargable', async () => {
        chargeVersionYear = { chargeVersion: { licenceId }, financialYearEnding: 2020, hasTwoPartAgreement: true, transactionType: 'two_part_tariff', isChargeable: false }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.true()
      })
      test('the 2nd part are not filtered out - charge version year transaction types = annual, no agreement, transaction dates overlaps with charge version', async () => {
        chargeVersionYear = { chargeVersion: { licenceId, startDate: '2019-04-01', endDate: '2020-03-31' }, financialYearEnding: 2020, hasTwoPartAgreement: false, transactionType: 'annual', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.true()
      })
      test('the 2nd part are not filtered out - charge version year transaction types = annual, no agreement, charge version end date is null', async () => {
        chargeVersionYear = { chargeVersion: { licenceId, startDate: '2019-04-01', endDate: null }, financialYearEnding: 2020, hasTwoPartAgreement: false, transactionType: 'annual', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.true()
      })
      test('the 2nd part are not filtered out - charge version year transaction types = annual, no agreement, charge version end date is null', async () => {
        chargeVersionYear = { chargeVersion: { licenceId, startDate: '2016-04-01', endDate: undefined }, financialYearEnding: 2020, hasTwoPartAgreement: false, transactionType: 'annual', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.true()
      })
      test('the 2nd part are filtered out - charge version year transaction types = annual, no agreement, transaction dates does not overlap with charge version', async () => {
        chargeVersionYear = { chargeVersion: { licenceId, startDate: '2020-02-01', endDate: '2021-05-31' }, financialYearEnding: 2020, hasTwoPartAgreement: false, transactionType: 'annual', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.false()
      })
      test('the second part transactions are filtered out if it is an annual transaction type that has a two part agreement', async () => {
        chargeVersionYear = { chargeVersion: { licenceId }, financialYearEnding: 2020, hasTwoPartAgreement: true, transactionType: 'annual', isChargeable: true }
        repos.billingBatchChargeVersionYears.findByBatchId.resolves([chargeVersionYear])
        const testResult = await transactionsService.getBatchTransactionHistory(batch.id)
        expect(testResult.includes(secondPartTrx)).to.be.false()
      })
    })
  })
})
