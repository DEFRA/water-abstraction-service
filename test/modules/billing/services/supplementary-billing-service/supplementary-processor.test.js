'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const uuid = require('uuid/v4')

const supplementaryBillingProcessor = require('../../../../../src/modules/billing/services/supplementary-billing-service/supplementary-processor')
const { actions } = require('../../../../../src/modules/billing/services/supplementary-billing-service/constants')

const batchId = uuid()

const { createTransaction, findTransactionById } = require('./test-helpers')

experiment('modules/billing/services/supplementary-billing-service/supplementary-processor', () => {
  let result

  experiment('when there are no historical transactions', () => {
    beforeEach(async () => {
      const transactions = [
        createTransaction(batchId, uuid())
      ]
      result = supplementaryBillingProcessor.processBatch(batchId, transactions)
    })

    test('no action is taken on the transaction', async () => {
      expect(result[0].action).to.be.null()
    })
  })

  experiment('when there are no current batch transactions', () => {
    experiment('and there is 1 historical transaction', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', uuid())
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('the transaction is marked for reversal', async () => {
        expect(result[0].action).to.equal(actions.reverseTransaction)
      })
    })

    experiment('when there are two historical transactions which sum to net zero', () => {
      const ids = [uuid(), uuid()]

      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            dateCreated: '2020-04-01 12:00:00',
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            dateCreated: '2020-04-02 12:00:00',
            isCredit: true
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('none of the transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null()
        expect(findTransactionById(result, ids[1]).action).to.be.null()
      })
    })

    experiment('when there are several historical transactions, some of which sum to net zero', () => {
      const ids = [uuid(), uuid(), uuid(), uuid(), uuid()]

      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            dateCreated: '2020-04-01 12:00:00',
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            dateCreated: '2020-04-02 12:00:00',
            isCredit: true
          }),
          createTransaction('historical-batch', ids[2], {
            dateCreated: '2020-04-03 12:00:00',
            isCredit: false
          }),
          createTransaction(batchId, ids[3], {
            dateCreated: '2020-04-03 12:00:00',
            volume: null,
            isCredit: false,
            isTwoPartSecondPartCharge: true
          }),
          createTransaction('historical-batch', ids[4], {
            dateCreated: '2020-04-03 12:00:00',
            isCredit: false,
            volume: 0,
            isTwoPartSecondPartCharge: true
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('only the most recent transaction is reversed to get to a net zero position', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null()
        expect(findTransactionById(result, ids[1]).action).to.be.null()
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.reverseTransaction)
        // these two transactions should cancel each other out
        expect(findTransactionById(result, ids[3]).action).to.equal(actions.deleteTransaction)
        expect(findTransactionById(result, ids[4]).action).to.be.null()
      })
    })
  })

  experiment('when there are current and historical transactions', () => {
    const ids = [uuid(), uuid(), uuid()]

    experiment('and there are annual transactions which have net zero billable days', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            billableDays: 365,
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            billableDays: 20,
            isCredit: true
          }),
          createTransaction(batchId, ids[2], {
            billableDays: 345,
            isCredit: false
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('the historical transactions are not reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null()
        expect(findTransactionById(result, ids[1]).action).to.be.null()
      })

      test('the current batch transaction is deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.deleteTransaction)
      })
    })

    experiment('and there are annual transactions which do not have net zero billable days', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            billableDays: 365,
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            billableDays: 20,
            isCredit: true
          }),
          createTransaction(batchId, ids[2], {
            billableDays: 355,
            isCredit: false
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('the historical transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.equal(actions.reverseTransaction)
        expect(findTransactionById(result, ids[1]).action).to.equal(actions.reverseTransaction)
      })

      test('the current batch transaction is not deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.be.null()
      })
    })

    experiment('and there are TPT transactions which have net zero volume', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            volume: 20.345,
            isTwoPartSecondPartCharge: true,
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            volume: 10,
            isTwoPartSecondPartCharge: true,
            isCredit: true
          }),
          createTransaction(batchId, ids[2], {
            volume: 10.345,
            isTwoPartSecondPartCharge: true,
            isCredit: false
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('the historical transactions are not reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null()
        expect(findTransactionById(result, ids[1]).action).to.be.null()
      })

      test('the current batch transaction is deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.deleteTransaction)
      })
    })

    experiment('and there are TPT transactions which do not have a net zero volume', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction('historical-batch', ids[0], {
            volume: 20.345,
            isTwoPartSecondPartCharge: true,
            isCredit: false
          }),
          createTransaction('historical-batch', ids[1], {
            volume: 10,
            isTwoPartSecondPartCharge: true,
            isCredit: true
          }),
          createTransaction(batchId, ids[2], {
            volume: 15,
            isTwoPartSecondPartCharge: true,
            isCredit: false
          })
        ]
        result = supplementaryBillingProcessor.processBatch(batchId, transactions)
      })

      test('the historical transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.equal(actions.reverseTransaction)
        expect(findTransactionById(result, ids[1]).action).to.equal(actions.reverseTransaction)
      })

      test('the current batch transaction is not deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.be.null()
      })
    })
  })
})
