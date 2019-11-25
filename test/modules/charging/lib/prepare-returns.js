const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createReturn, createMonthlyReturn, createPurposeData } = require('./test-return-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const { flatMap } = require('lodash');
const {
  isLineWithinAbstractionPeriod,
  checkReturnsAreCompleted,
  isReturnPurposeTPT,
  getTPTReturns,
  prepareReturnLinesData
} = require('../../../../src/modules/charging/lib/prepare-returns');

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
  experiment('.checkReturnsAreCompleted', async () => {
    test('return error if there are no returns for matching', async () => {
      const [returnError] = checkReturnsAreCompleted([]);
      expect(returnError.type).to.equal('return');
      expect(returnError.msg).to.equal('No returns available for matching');
    });
    test('return error for return that is under query', async () => {
      const completedRetOptions = {
        returnId: 'completed-return',
        status: 'completed',
        isUnderQuery: false
      };
      const underQueryRetOptions = {
        returnId: 'under-query-return',
        status: 'completed',
        isUnderQuery: true
      };
      const returnsToCheck = [createReturn(completedRetOptions), createReturn(underQueryRetOptions)];
      const [returnError] = checkReturnsAreCompleted(returnsToCheck);

      expect(returnError.type).to.equal('return');
      expect(returnError.msg).to.equal(`${underQueryRetOptions.returnId} is under query`);
    });
    test('return error for return that does not have a "completed" status', async () => {
      const receivedRetOptions = {
        returnId: 'received-return',
        status: 'received',
        isUnderQuery: false
      };
      const completedRetOptions = {
        returnId: 'completed-return',
        status: 'completed',
        isUnderQuery: false
      };
      const returnsToCheck = [createReturn(receivedRetOptions), createReturn(completedRetOptions)];
      const [returnError] = checkReturnsAreCompleted(returnsToCheck);
      expect(returnError.type).to.equal('return');
      expect(returnError.msg).to.equal(`${receivedRetOptions.returnId} is not completed`);
    });
    test('return an error for each return with an error', async () => {
      const receivedRetOptions = {
        returnId: 'received-return',
        status: 'received',
        isUnderQuery: false
      };
      const completedRetOptions = {
        returnId: 'completed-return',
        status: 'completed',
        isUnderQuery: false
      };
      const underQueryRetOptions = {
        returnId: 'under-query-return',
        status: 'completed',
        isUnderQuery: true
      };
      const returnsToCheck = [
        createReturn(receivedRetOptions),
        createReturn(completedRetOptions),
        createReturn(underQueryRetOptions)];
      const returnErrors = checkReturnsAreCompleted(returnsToCheck);
      expect(returnErrors[0].type).to.equal('return');
      expect(returnErrors[0].msg).to.equal(`${receivedRetOptions.returnId} is not completed`);
      expect(returnErrors[1].type).to.equal('return');
      expect(returnErrors[1].msg).to.equal(`${underQueryRetOptions.returnId} is under query`);
    });
    test('no errors returned if all returns are completed', async () => {
      const completedRetOptions = {
        status: 'completed',
        isUnderQuery: false
      };
      const returnsToCheck = [
        createReturn({ ...completedRetOptions, returnId: 'completed-return-1' }),
        createReturn({ ...completedRetOptions, returnId: 'completed-return-2' }),
        createReturn({ ...completedRetOptions, returnId: 'completed-return-3' })
      ];
      const returnErrors = checkReturnsAreCompleted(returnsToCheck);
      expect(returnErrors).to.be.null();
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
