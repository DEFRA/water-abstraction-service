const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createReturn, createMonthlyReturn, createPurposeData } = require('../../test-data/test-return-data');
const Decimal = require('decimal.js-light');
const { flatMap } = require('lodash');
const {
  isLineWithinAbstractionPeriod,
  checkForReturnsErrors,
  isReturnPurposeTPT,
  getTPTReturns,
  prepareReturnLinesData
} = require('../../../../../src/modules/billing/services/two-part-tariff-service/prepare-returns');
const {
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_NO_RETURNS_SUBMITTED,
  ERROR_SOME_RETURNS_DUE,
  ERROR_LATE_RETURNS,
  ERROR_UNDER_QUERY,
  ERROR_RECEIVED_NO_DATA
} = require('../../../../../src/lib/models/billing-volume').twoPartTariffStatuses;

experiment('modules/charging/lib/prepare-returns', async () => {
  experiment('.isLineWithinAbstractionPeriod', async () => {
    experiment('when abstraction period does not straddle financial year', async => {
      const returnOptions = {
        periodStartDay: 1,
        periodStartMonth: 8,
        periodEndDay: 31,
        periodEndMonth: 12
      };
      const ret = createReturn(returnOptions);
      test('returns true when line is completely within abstraction period', async () => {
        const line = { startDate: '2018-08-01', endDate: '2018-08-31' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line startDate is within abstraction period', async () => {
        const line = { startDate: '2018-12-30', endDate: '2019-01-06' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line endDate is within abstraction period', async () => {
        const line = { startDate: '2018-07-29', endDate: '2018-08-04' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns false when line is not within abstraction period', async () => {
        const line = { startDate: '2018-07-01', endDate: '2018-07-30' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.false();
      });
    });
    experiment('when abstraction period straddles financial year', async => {
      const returnOptions = {
        periodStartDay: 1,
        periodStartMonth: 1,
        periodEndDay: 30,
        periodEndMonth: 6
      };
      const ret = createReturn(returnOptions);
      test('returns true when line is completely within abstraction period', async () => {
        const line = { startDate: '2019-06-23', endDate: '2019-06-29' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line startDate is within abstraction period', async () => {
        const line = { startDate: '2019-06-30', endDate: '2019-07-06' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line endDate is within abstraction period', async () => {
        const line = { startDate: '2018-12-30', endDate: '2019-01-05' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns false when line is not within abstraction period', async () => {
        const line = { startDate: '2019-07-01', endDate: '2019-07-01' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.false();
      });
    });
    experiment('when abstraction period straddles calendar year', async => {
      const returnOptions = {
        periodStartDay: 1,
        periodStartMonth: 10,
        periodEndDay: 31,
        periodEndMonth: 3
      };
      const ret = createReturn(returnOptions);
      test('returns true when line is completely within abstraction period', async () => {
        const line = { startDate: '2018-12-30', endDate: '2019-01-05' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line startDate is within abstraction period', async () => {
        const line = { startDate: '2019-03-31', endDate: '2019-04-06' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns true when line endDate is within abstraction period', async () => {
        const line = { startDate: '2019-09-29', endDate: '2019-10-05' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.true();
      });
      test('returns false when line is not within abstraction period', async () => {
        const line = { startDate: '2019-06-23', endDate: '2019-06-29' };
        const result = isLineWithinAbstractionPeriod(ret, line);
        expect(result).to.be.false();
      });
    });
  });
  experiment('.checkForReturnsErrors', async () => {
    const completedRet = createReturn({
      returnId: 'completed-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-10-15',
      isUnderQuery: false
    });
    const dueRet = createReturn({
      returnId: 'due-return',
      status: 'due',
      dueDate: '2018-11-01',
      receivedDate: null,
      isUnderQuery: false
    });
    const lateRet = createReturn({
      returnId: 'late-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-12-10',
      isUnderQuery: false
    });
    const beforeCutOffRet = createReturn({
      returnId: 'within-cut-off-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-11-05',
      isUnderQuery: false
    });
    const underQueryRet = createReturn({
      returnId: 'under-query-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-11-01',
      isUnderQuery: true
    });

    test('return error if there are no returns for matching', async () => {
      const returnError = checkForReturnsErrors([]);
      expect(returnError).to.equal(ERROR_NO_RETURNS_FOR_MATCHING);
    });

    test('return error if all of the returns are due', async () => {
      const returnError = checkForReturnsErrors([dueRet, dueRet, dueRet]);
      expect(returnError).to.equal(ERROR_NO_RETURNS_SUBMITTED);
    });

    test('return error if any of the returns is due', async () => {
      const returnError = checkForReturnsErrors([completedRet, completedRet, dueRet]);
      expect(returnError).to.equal(ERROR_SOME_RETURNS_DUE);
    });

    test('return error if any of the returns are late', async () => {
      const returnError = checkForReturnsErrors([completedRet, completedRet, lateRet]);
      expect(returnError).to.equal(ERROR_LATE_RETURNS);
    });

    test('no error if returns were submitted after due date, but within grace period', async () => {
      const returnError = checkForReturnsErrors([beforeCutOffRet, completedRet, beforeCutOffRet]);
      expect(returnError).to.be.undefined();
    });

    test('return error for return that is under query', async () => {
      const returnsToCheck = [completedRet, underQueryRet];
      const returnError = checkForReturnsErrors(returnsToCheck);

      expect(returnError).to.equal(ERROR_UNDER_QUERY);
    });
    test('return received and under query returns only under query error', async () => {
      const underQueryReceivedRet = createReturn({
        returnId: 'under-query-return',
        status: 'received',
        isUnderQuery: true
      });
      const returnsToCheck = [underQueryReceivedRet];
      const returnError = checkForReturnsErrors(returnsToCheck);

      expect(returnError).to.equal(ERROR_UNDER_QUERY);
    });
    test('return error for return that has a "received" status', async () => {
      const receivedRet = createReturn({
        returnId: 'received-return',
        status: 'received',
        dueDate: '2018-11-01',
        receivedDate: '2018-11-01',
        isUnderQuery: false
      });

      const returnsToCheck = [completedRet, receivedRet, completedRet];
      const returnError = checkForReturnsErrors(returnsToCheck);
      expect(returnError).to.equal(ERROR_RECEIVED_NO_DATA);
    });
    test('no errors returned if all returns are completed', async () => {
      const returnErrors = checkForReturnsErrors([completedRet, completedRet, completedRet]);
      expect(returnErrors).to.be.undefined();
    });
  });
  experiment('.isReturnPurposeTPT', async () => {
    test('returns true when return contains TPT purpose', async () => {
      const purposes = [createPurposeData('300'), createPurposeData('180'), createPurposeData('420'), createPurposeData('560'), createPurposeData('200')];
      const returnPurposes = flatMap(purposes);
      expect(isReturnPurposeTPT(returnPurposes)).to.be.true();
    });
    test('returns false when return does not contain a TPT purpose', async () => {
      const purposes = [createPurposeData('300'), createPurposeData('180'), createPurposeData('560'), createPurposeData('200')];
      const returnPurposes = flatMap(purposes);
      expect(isReturnPurposeTPT(returnPurposes)).to.be.false();
    });
  });
  experiment('.getTPTReturns', async () => {
    test('only return returns which are for TPT_PURPOSES', async () => {
      const returns = [
        createReturn({ tertiaryCode: 400, returnId: 'return-1' }),
        createReturn({ tertiaryCode: 186, returnId: 'return-2' }),
        createReturn({ tertiaryCode: 390, returnId: 'return-3' }),
        createReturn({ tertiaryCode: 260, returnId: 'return-4' })
      ];
      const tptReturns = [
        createReturn({ tertiaryCode: 400, returnId: 'return-1' }),
        createReturn({ tertiaryCode: 390, returnId: 'return-3' })
      ];
      const filteredReturns = getTPTReturns(returns);
      expect(filteredReturns).to.equal(tptReturns);
    });
    test('returns an empty array if no TPT returns available', async () => {
      const returns = [
        createReturn({ tertiaryCode: 186 }),
        createReturn({ tertiaryCode: 260 })
      ];
      const filteredReturns = getTPTReturns(returns);
      expect(filteredReturns).to.be.an.array().and.to.be.empty();
    });
  });
  experiment('.prepareReturnLinesData', async () => {
    const getPreparedLines = lines => {
      const returnLines = lines;
      const linesWithQuantity = returnLines.filter(line => line.quantity > 0);
      linesWithQuantity.forEach(line => {
        line.quantity = new Decimal(line.quantity).dividedBy(1000).toNumber();
        line.quantityAllocated = 0;
      });
      return linesWithQuantity;
    };
    test('only return lines with a value', async () => {
      const ret = createMonthlyReturn({
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: 31,
        periodEndMonth: 3,
        periodStartDay: 1,
        periodStartMonth: 4,
        tertiaryCode: '400',
        quantities: [0, 0, 0, 0, 0, 0, 12, 20, 15, 23, 50, 0]
      });
      const [{ lines }] = prepareReturnLinesData([ret]);
      const returnLines = ret.lines;
      expect(lines).to.equal(getPreparedLines(returnLines));
    });
    test('only return lines within the abstraction period', async () => {
      const ret = createMonthlyReturn({
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: 31,
        periodEndMonth: 10,
        periodStartDay: 1,
        periodStartMonth: 4,
        tertiaryCode: '400',
        quantities: [6, 9, 14, 8, 5, 10, 12, 20, 15, 23, 12, 7]
      });
      const [{ lines }] = prepareReturnLinesData([ret]);
      const returnLines = ret.lines.slice(0, 7);
      expect(lines).to.equal(getPreparedLines(returnLines));
    });
  });
});
