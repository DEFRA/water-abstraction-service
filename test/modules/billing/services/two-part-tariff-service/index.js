const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const { processBatch } = require('../../../../../src/modules/billing/services/two-part-tariff-service');
const returnsHelpers = require('../../../../../src/modules/billing/services/two-part-tariff-service/returns-helpers');
const twoPartTariffMatching = require('../../../../../src/modules/billing/services/two-part-tariff-service/two-part-tariff-matching');

const Batch = require('../../../../../src/lib/models/batch');
const Transaction = require('../../../../../src/lib/models/transaction');
const ChargeElement = require('../../../../../src/lib/models/charge-element');

const { batch, chargeElement, licence, abstractionPeriod, transaction } = require('./test-batch');

const returns = [
  {
    returnId: 'test-return-id',
    lines: [{
      startDate: '2019-04-01',
      endDate: '2019-04-30',
      quantity: 540,
      timePeriod: 'month'
    }, {
      startDate: '2019-05-01',
      endDate: '2019-05-31',
      quantity: 740,
      timePeriod: 'month'
    }, {
      startDate: '2019-06-01',
      endDate: '2019-06-30',
      quantity: 680,
      timePeriod: 'month'
    }]
  }];

const matchingResults = {
  error: null,
  data: [{
    error: null,
    data: {
      chargeElementId: chargeElement.id,
      actualReturnQuantity: 1.96
    }
  }]
};

experiment('modules/billing/services/two-part-tariff-service .processBatch', async () => {
  let result;
  beforeEach(async () => {
    sandbox.stub(returnsHelpers, 'getReturnsForMatching').resolves(returns);
    sandbox.stub(twoPartTariffMatching, 'matchReturnsToChargeElements').returns(matchingResults);

    result = await processBatch(batch);
  });

  afterEach(async () => sandbox.restore());

  test('calls returns helpers with correct arguments to get returns data', async () => {
    const [licenceArg, batchArg] = returnsHelpers.getReturnsForMatching.lastCall.args;
    expect(licenceArg).to.equal(licence);
    expect(batchArg).to.equal(batch);
  });

  test('maps required charge element data from transactions', async () => {
    const [chargeElements] = twoPartTariffMatching.matchReturnsToChargeElements.lastCall.args;
    expect(chargeElements[0]).not.to.be.instanceOf(ChargeElement);
    expect(chargeElements[0]).to.equal({
      id: chargeElement.id,
      source: 'unsupported',
      season: 'summer',
      loss: 'medium',
      eiucSource: 'other',
      abstractionPeriod: {
        startDay: abstractionPeriod.startDay,
        startMonth: abstractionPeriod.startMonth,
        endDay: abstractionPeriod.endDay,
        endMonth: abstractionPeriod.endMonth
      },
      authorisedAnnualQuantity: 20,
      billabledAnnualQuantity: null,
      totalDays: transaction.authorisedDays,
      billableDays: transaction.billableDays,
      startDate: transaction.chargePeriod.startDate,
      endDate: transaction.chargePeriod.endDate,
      purposeUse: {
        type: 'use',
        name: 'Spray irrigation',
        code: '420'
      }
    });
  });

  test('passes returns to matching algorithm', async () => {
    const [, returnsForMatching] = twoPartTariffMatching.matchReturnsToChargeElements.lastCall.args;
    expect(returnsForMatching).to.equal(returns);
  });

  test('returns a Batch', async () => {
    expect(result).to.be.instanceOf(Batch);
  });

  experiment('when data is returned from matching algorithm', async () => {
    test('maps matching data to transaction correctly', async () => {
      const { transactions: [transaction] } = result.invoices[0].invoiceLicences[0];
      expect(transaction.calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      expect(transaction.volume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      expect(transaction.twoPartTariffStatus).to.be.null();
      expect(transaction.twoPartTariffError).to.false();
    });
  });

  experiment('when data returned from matching algorithm is null', async () => {
    test('maps matching data to transaction correctly', async () => {
      twoPartTariffMatching.matchReturnsToChargeElements.returns({
        error: Transaction.twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING,
        data: null
      });

      result = await processBatch(batch);

      const { transactions: [transaction] } = result.invoices[0].invoiceLicences[0];
      expect(transaction.calculatedVolume).to.be.null();
      expect(transaction.volume).to.be.null();
      expect(transaction.twoPartTariffStatus).to.equal(Transaction.twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING);
      expect(transaction.twoPartTariffError).to.true();
    });
  });

  experiment('when an error is returned from matching algorithm', async () => {
    test('if the error is an overallError maps matching data to transaction correctly', async () => {
      twoPartTariffMatching.matchReturnsToChargeElements.returns({
        ...matchingResults,
        error: Transaction.twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE
      });

      result = await processBatch(batch);

      const { transactions: [transaction] } = result.invoices[0].invoiceLicences[0];
      expect(transaction.calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      expect(transaction.volume).to.be.null();
      expect(transaction.twoPartTariffStatus).to.equal(Transaction.twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE);
      expect(transaction.twoPartTariffError).to.true();
    });

    test('if the error is specific to transaction maps matching data to transaction correctly', async () => {
      twoPartTariffMatching.matchReturnsToChargeElements.returns({
        ...matchingResults,
        data: [{
          ...matchingResults.data[0],
          error: Transaction.twoPartTariffStatuses.ERROR_OVER_ABSTRACTION
        }]
      });

      result = await processBatch(batch);

      const { transactions: [transaction] } = result.invoices[0].invoiceLicences[0];
      expect(transaction.calculatedVolume).to.equal(matchingResults.data[0].data.actualReturnQuantity);
      expect(transaction.volume).to.be.null();
      expect(transaction.twoPartTariffStatus).to.equal(Transaction.twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
      expect(transaction.twoPartTariffError).to.true();
    });
  });
});
