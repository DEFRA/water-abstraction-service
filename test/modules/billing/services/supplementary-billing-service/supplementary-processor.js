'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const supplementaryBillingProcessor = require('../../../../../src/modules/billing/services/supplementary-billing-service/supplementary-processor');
const { actions } = require('../../../../../src/modules/billing/services/supplementary-billing-service/constants');

const batchId = uuid();

const createTransaction = (id, overrides = {}) => {
  const defaults = {
    billingTransactionId: id,
    billingInvoiceLicenceId: 'billing-invoice-licence-1',
    chargeElementId: 'charge-element-1',
    startDate: '2014-04-01',
    endDate: '2015-03-31',
    abstractionPeriod: {
      endDay: 31,
      endMonth: 3,
      startDay: 1,
      startMonth: 4
    },
    netAmount: null,
    isCredit: false,
    authorisedQuantity: '21.48',
    billableQuantity: null,
    authorisedDays: 365,
    billableDays: 365,
    status: 'candidate',
    description: 'Big stream near the babbling brook',
    dateCreated: '2021-02-26T13:01:28.732Z',
    dateUpdated: '2021-02-26T13:01:28.732Z',
    source: 'unsupported',
    season: 'all year',
    loss: 'medium',
    chargeType: 'standard',
    externalId: null,
    volume: '21.48',
    section126Factor: null,
    section127Agreement: false,
    section130Agreement: null,
    isTwoPartTariffSupplementary: false,
    calculatedVolume: null,
    twoPartTariffError: null,
    twoPartTariffStatus: null,
    twoPartTariffReview: null,
    isDeMinimis: false,
    isNewLicence: false,
    legacyId: null,
    metadata: null,
    sourceTransactionId: null,
    licenceId: 'licence-1',
    licenceRef: '01/123/A',
    invoiceAccountNumber: 'A00000000A',
    financialYearEnding: 2021,
    invoiceAccountId: 'invoice-account-1',
    billingBatchId: batchId,
    isSummer: false
  };

  return Object.assign(defaults, overrides);
};

const findTransactionById = (result, id) => result.find(
  transaction => transaction.billingTransactionId === id
);

experiment('modules/billing/services/supplementary-billing-service/supplementary-processor', () => {
  let result;

  experiment('when there are no historical transactions', async () => {
    beforeEach(async () => {
      const transactions = [
        createTransaction(uuid())
      ];
      result = supplementaryBillingProcessor.processBatch(batchId, transactions);
    });

    test('no action is taken on the transaction', async () => {
      expect(result[0].action).to.be.null();
    });
  });

  experiment('when there are no current batch transactions', async () => {
    experiment('and there is 1 historical transaction', () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction(uuid(), {
            billingBatchId: 'historical-batch'
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('the transaction is marked for reversal', async () => {
        expect(result[0].action).to.equal(actions.reverseTransaction);
      });
    });

    experiment('when there are two historical transactions which sum to net zero', async () => {
      const ids = [uuid(), uuid()];

      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            dateCreated: '2020-04-01 12:00:00',
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            dateCreated: '2020-04-02 12:00:00',
            isCredit: true
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('none of the transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null();
        expect(findTransactionById(result, ids[1]).action).to.be.null();
      });
    });

    experiment('when there are several historical transactions, some of which sum to net zero', async () => {
      const ids = [uuid(), uuid(), uuid()];

      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            dateCreated: '2020-04-01 12:00:00',
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            dateCreated: '2020-04-02 12:00:00',
            isCredit: true
          }),
          createTransaction(ids[2], {
            billingBatchId: 'historical-batch',
            dateCreated: '2020-04-03 12:00:00',
            isCredit: false
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('only the most recent transaction is reversed to get to a net zero position', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null();
        expect(findTransactionById(result, ids[1]).action).to.be.null();
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.reverseTransaction);
      });
    });
  });

  experiment('when there are current and historical transactions', async () => {
    const ids = [uuid(), uuid(), uuid()];

    experiment('and there are annual transactions which have net zero billable days', async () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            billableDays: 365,
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            billableDays: 20,
            isCredit: true
          }),
          createTransaction(ids[2], {
            billableDays: 345,
            isCredit: false
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('the historical transactions are not reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null();
        expect(findTransactionById(result, ids[1]).action).to.be.null();
      });

      test('the current batch transaction is deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.deleteTransaction);
      });
    });

    experiment('and there are annual transactions which do not have net zero billable days', async () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            billableDays: 365,
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            billableDays: 20,
            isCredit: true
          }),
          createTransaction(ids[2], {
            billableDays: 355,
            isCredit: false
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('the historical transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.equal(actions.reverseTransaction);
        expect(findTransactionById(result, ids[1]).action).to.equal(actions.reverseTransaction);
      });

      test('the current batch transaction is not deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.be.null();
      });
    });

    experiment('and there are TPT transactions which have net zero volume', async () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            volume: 20.345,
            isTwoPartTariffSupplementary: true,
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            volume: 10,
            isTwoPartTariffSupplementary: true,
            isCredit: true
          }),
          createTransaction(ids[2], {
            volume: 10.345,
            isTwoPartTariffSupplementary: true,
            isCredit: false
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('the historical transactions are not reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.be.null();
        expect(findTransactionById(result, ids[1]).action).to.be.null();
      });

      test('the current batch transaction is deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.equal(actions.deleteTransaction);
      });
    });

    experiment('and there are TPT transactions which do not have a net zero volume', async () => {
      beforeEach(async () => {
        const transactions = [
          createTransaction(ids[0], {
            billingBatchId: 'historical-batch',
            volume: 20.345,
            isTwoPartTariffSupplementary: true,
            isCredit: false
          }),
          createTransaction(ids[1], {
            billingBatchId: 'historical-batch',
            volume: 10,
            isTwoPartTariffSupplementary: true,
            isCredit: true
          }),
          createTransaction(ids[2], {
            volume: 15,
            isTwoPartTariffSupplementary: true,
            isCredit: false
          })
        ];
        result = supplementaryBillingProcessor.processBatch(batchId, transactions);
      });

      test('the historical transactions are reversed', async () => {
        expect(findTransactionById(result, ids[0]).action).to.equal(actions.reverseTransaction);
        expect(findTransactionById(result, ids[1]).action).to.equal(actions.reverseTransaction);
      });

      test('the current batch transaction is not deleted', async () => {
        expect(findTransactionById(result, ids[2]).action).to.be.null();
      });
    });
  });
});
