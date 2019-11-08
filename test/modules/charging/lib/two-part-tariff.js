const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { getChargeElement, wrapElementsInVersion } = require('./test-charge-data');
const { createReturn, createMonthlyReturn, createWeeklyReturn, createPurposeData } = require('./test-return-data');
const sandbox = require('sinon').createSandbox();
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const helpers = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');
const {
  matchReturnQuantities,
  matchReturnsToChargeElements
} = require('../../../../src/modules/charging/lib/two-part-tariff');

experiment('modules/charging/lib/two-part-tariff', async () => {
  experiment('.matchReturnQuantites', async () => {
    beforeEach(async () => {
      sandbox.stub(helpers, 'matchReturnLineToElement');
    });
    afterEach(async () => {
      sandbox.restore();
    });
    const chargeElement = [getChargeElement({
      actualAnnualQuantity: 0,
      purposeTertiary: 400
    })];
    const returnLines = [{
      startDate: '2016-11-01',
      quantity: 0.017,
      quantityAllocated: 0
    }, {
      startDate: '2016-12-01',
      quantity: 0.022,
      quantityAllocated: 0
    }, {
      startDate: '2017-01-01',
      quantity: 0.05,
      quantityAllocated: 0
    }];
    test('returns charge element with updated actualAnnualQuantity', async () => {
      const ret = [createReturn({
        tertiaryCode: '400',
        quantityAlloccated: 0,
        lineData: returnLines
      })];
      helpers.matchReturnLineToElement.returns({
        updatedLineQuantityAllocated: 0.05,
        updatedElementQuantity: 0.05
      });
      const matchedChargeElement = matchReturnQuantities(chargeElement, ret);
      expect(matchedChargeElement[0].actualAnnualQuantity).to.equal(0.05);
    });
  });
  experiment('.matchReturnsToChargeElements', async () => {
    experiment('allocating quantities to correct charge elements', async () => {
      const chargeElementOptions = {
        purposeTertiary: 400,
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        abstractionPeriodStartDay: '1',
        abstractionPeriodStartMonth: '4',
        abstractionPeriodEndDay: '31',
        abstractionPeriodEndMonth: '3',
        source: 'unsupported',
        totalDays: 365,
        billableDays: 182,
        authorisedAnnualQuantity: 5.5
      };
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: '31',
        periodEndMonth: '3',
        periodStartDay: '1',
        periodStartMonth: '4',
        quantityAllocated: 0
      };
      const chargeElement = [getChargeElement(chargeElementOptions)];
      const secondChargeElement = getChargeElement({
        ...chargeElementOptions,
        purposeTertiary: 380
      });
      const tptReturns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: [0, 0, 0, 0, 0, 0, 0, 17, 22, 50, 0, 0] // total: 89
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '380',
        quantities: [0, 0, 0, 12, 18, 11, 3, 0, 8, 0, 0, 0] // total: 52
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: [0, 0, 8, 15, 4, 7, 9, 15, 0, 0, 0, 0] // total: 68
      })];
      const otherPurposeReturns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '200',
        quantities: [0, 0, 0, 0, 0, 0, 12, 2, 22, 34, 0, 0] // total: 70
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '200',
        quantities: [0, 0, 0, 5, 18, 11, 13, 0, 20, 0, 0, 0] // total: 67
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '180',
        quantities: [0, 0, 0, 15, 4, 7, 9, 11, 14, 0, 0, 0] // total: 60
      })];
      test('only return quantities with matching purpose are applied to the charge element', async () => {
        const matchedElements = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), [...tptReturns, ...otherPurposeReturns]);
        expect(matchedElements[0].actualAnnualQuantity).to.equal(0.147);
      });
      test('no quantity is allocated if there are no TPT returns', async () => {
        const matchedElements = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), otherPurposeReturns);
        expect(matchedElements[0].actualAnnualQuantity).to.equal(0);
      });
      test('when there are charge elements and returns with different TPT purposes', async () => {
        const matchedElements = matchReturnsToChargeElements(wrapElementsInVersion(
          [...chargeElement, secondChargeElement]), [...tptReturns, ...otherPurposeReturns]);
        expect(matchedElements[0].actualAnnualQuantity).to.equal(0.147);
        expect(matchedElements[1].actualAnnualQuantity).to.equal(0.052);
      });
      test('quantities are allocated correctly for returns with multiple purposes', async () => {
        const [nonTptPurpose] = createPurposeData('260');
        const updatedTpTReturns = tptReturns.map(ret => {
          ret.metadata.purposes.push(nonTptPurpose);
          return ret;
        });
        const updatedOtherReturns = otherPurposeReturns.map(ret => {
          ret.metadata.purposes.push(nonTptPurpose);
          return ret;
        });

        const matchedElements = matchReturnsToChargeElements(wrapElementsInVersion(
          [...chargeElement, secondChargeElement]), [...updatedTpTReturns, ...updatedOtherReturns]);
        expect(matchedElements[0].actualAnnualQuantity).to.equal(0.147);
        expect(matchedElements[1].actualAnnualQuantity).to.equal(0.052);
      });
    });

    experiment('allocating correct quantities to charge elements', async () => {
      const chargeElementOptions = {
        purposeTertiary: 400,
        startDate: '2016-10-01',
        endDate: '2017-03-31',
        abstractionPeriodStartDay: '1',
        abstractionPeriodStartMonth: '4',
        abstractionPeriodEndDay: '31',
        abstractionPeriodEndMonth: '3',
        source: 'unsupported',
        totalDays: 182,
        billableDays: 31,
        authorisedAnnualQuantity: 1
      };
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: '31',
        periodEndMonth: '3',
        periodStartDay: '1',
        periodStartMonth: '4',
        quantityAllocated: 0
      };
      const chargeElement = [getChargeElement(chargeElementOptions)];
      test('actualAnnualQuantity does not exceed maxAllowableQuantity', async () => {
        const returns = [createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: [0, 0, 0, 0, 0, 0, 12, 20, 15, 23, 50, 0]
        }), createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: [0, 0, 0, 0, 0, 0, 12, 18, 11, 16, 8, 0]
        })];
        const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
        const expectedActualAnnualQuantity = new Decimal(chargeElement[0].authorisedAnnualQuantity)
          .times(chargeElement[0].billableDays)
          .dividedBy(chargeElement[0].totalDays)
          .toNumber();
        expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
      });
      test('actualAnnualQuantity does not exceed total quantities', async () => {
        const firstQuantities = [0, 0, 0, 0, 0, 0, 12, 12, 15, 0, 0, 0];
        const secondQuantities = [0, 0, 0, 0, 0, 0, 12, 18, 11, 0, 8, 0];
        const returns = [createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: firstQuantities
        }), createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: secondQuantities
        })];
        const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
        const totalReturnQuantities = firstQuantities.reduce((a, b) => a + b, 0) + secondQuantities.reduce((a, b) => a + b, 0);
        const expectedActualAnnualQuantity = new Decimal(totalReturnQuantities).dividedBy(1000).toNumber();
        expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
      });
    });
  });
  experiment('allocating quantities in the correct date range', async () => {
    const chargeElementOptions = {
      purposeTertiary: 400,
      startDate: '2016-04-01',
      endDate: '2016-09-30',
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '4',
      abstractionPeriodEndDay: '31',
      abstractionPeriodEndMonth: '3',
      source: 'unsupported',
      totalDays: 365,
      billableDays: 182,
      authorisedAnnualQuantity: 5
    };
    test('return quantities are not applied outside of the charge element date range', async () => {
      const chargeElement = [getChargeElement(chargeElementOptions)];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '31',
        periodEndMonth: '3'
      };
      const returnQuantities = [0, 0, 0, 12, 18, 11, 3, 0, 8, 0, 0, 0];
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: [0, 0, 0, 0, 0, 0, 0, 17, 22, 50, 0, 0]
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities
      })];
      const sumOfRelevantQuantities = returnQuantities.slice(0, 6).reduce((a, b) => a + b, 0);
      const expectedActualAnnualQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).toNumber();

      const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
      expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
    });
    test('does not allocate quantities outside the return abstraction period', async () => {
      const chargeElement = [getChargeElement({ ...chargeElementOptions, endDate: '2017-03-31' })];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '30',
        periodEndMonth: '11'
      };
      const returnQuantities1 = [0, 0, 0, 0, 0, 0, 0, 17, 22, 50, 0, 0];
      const returnQuantities2 = [0, 0, 0, 12, 18, 11, 3, 0, 8, 0, 0, 0];
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities1
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities2
      })];
      const sumOfRelevantQuantities = returnQuantities1.slice(0, 8).reduce((a, b) => a + b, 0) + returnQuantities2.slice(0, 8).reduce((a, b) => a + b, 0);
      const expectedActualAnnualQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).toNumber();

      const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
      expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
    });
    test('does not allocate quantities outside the charge elements abstraction period', async () => {
      const chargeElement = [getChargeElement({
        ...chargeElementOptions,
        abstractionPeriodEndDay: '31',
        abstractionPeriodEndMonth: '8'
      })];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '31',
        periodEndMonth: '3'
      };
      const returnQuantities = [0, 0, 0, 12, 18, 11, 3, 0, 8, 0, 0, 0];
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: [0, 0, 0, 0, 0, 0, 0, 17, 22, 50, 0, 0]
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities
      })];
      const sumOfRelevantQuantities = returnQuantities.slice(0, 5).reduce((a, b) => a + b, 0);
      const expectedActualAnnualQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).toNumber();

      const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
      expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
    });
    experiment('where a charge version ends partway through a return line, pro rata quantity is allocated', async () => {
      test('monthly return', async () => {
        const chargeElement = [{ ...getChargeElement(chargeElementOptions), endDate: '2017-01-18' }];
        const returnOptions = {
          startDate: '2016-04-01',
          endDate: '2017-03-31',
          periodStartDay: '1',
          periodStartMonth: '4',
          periodEndDay: '31',
          periodEndMonth: '3'
        };
        const returnQuantities = [0, 0, 0, 12, 18, 11, 3, 17, 30, 50, 0, 0];
        const returns = [createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: returnQuantities
        })];

        const sumOfRelevantQuantities = returnQuantities.slice(0, 9).reduce((a, b) => a + b, 0) + new Decimal(returnQuantities[9]).times(18).dividedBy(31).toNumber();
        const expectedActualAnnualQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).toNumber();

        const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
        expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
      });
      test('weekly return', async () => {
        const chargeElement = [{ ...getChargeElement(chargeElementOptions), endDate: '2016-07-12' }];
        const returnOptions = {
          startDate: '2016-04-03',
          endDate: '2017-03-31',
          periodStartDay: '1',
          periodStartMonth: '4',
          periodEndDay: '31',
          periodEndMonth: '3'
        };
        const returnQuantities = [0, 0, 0, 2, 4, 3, 3, 7, 2, 1, 6, 8, 0, 1, 4, 6, 7, 0, 0, 8, 1, 4, 3, 2];
        const returns = [createWeeklyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: returnQuantities
        })];
        const sumOfRelevantQuantities = returnQuantities.slice(0, 14).reduce((a, b) => a + b, 0) + new Decimal(returnQuantities[14]).times(3).dividedBy(7).toNumber();
        const expectedActualAnnualQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).toNumber();

        const [matchedChargeElement] = matchReturnsToChargeElements(wrapElementsInVersion(chargeElement), returns);
        expect(matchedChargeElement.actualAnnualQuantity).to.equal(expectedActualAnnualQuantity);
      });
    });
  });
  experiment('allocating quantities to charge elements in correct order', async () => {
    const chargeElementOptions = {
      purposeTertiary: 400,
      startDate: '2016-04-01',
      endDate: '2016-09-30',
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '4',
      abstractionPeriodEndDay: '31',
      abstractionPeriodEndMonth: '3',
      source: 'unsupported',
      totalDays: 365,
      billableDays: 182,
      authorisedAnnualQuantity: 1
    };
    test('base element is filled up before other elements', async () => {
      const chargeElements = [getChargeElement(chargeElementOptions), // pro rata quantity 0.49863
        {
          ...getChargeElement(chargeElementOptions),
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2016-05-31',
          endDate: '2016-05-31',
          totalDays: 365,
          billableDays: 60,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.16438
        }];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '31',
        periodEndMonth: '3'
      };
      const returnQuantities1 = [40, 32, 50, 36, 32, 55, 30, 54, 37, 37, 50, 68]; // Apr-Sept total: 245
      const returnQuantities2 = [25, 37, 74, 51, 39, 46, 32, 49, 48, 57, 45, 52]; // Apr-Sept total: 292
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities1
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities2
      })];

      const matchedChargeElements = matchReturnsToChargeElements(wrapElementsInVersion(chargeElements), returns);

      const sumOfRelevantQuantities = returnQuantities1.slice(0, 6).reduce((a, b) => a + b, 0) + returnQuantities2.slice(0, 6).reduce((a, b) => a + b, 0);
      const timeLimitedQuantity = new Decimal(sumOfRelevantQuantities).dividedBy(1000).minus(matchedChargeElements[0].maxAllowableQuantity).toNumber();

      expect(matchedChargeElements[0].actualAnnualQuantity).to.equal(matchedChargeElements[0].maxAllowableQuantity);
      expect(matchedChargeElements[1].actualAnnualQuantity).to.equal(timeLimitedQuantity);
    });
    test('first two elements are filled before third', async () => {
      const chargeElements = [getChargeElement(chargeElementOptions), // pro rata quantity 0.49863
        {
          ...getChargeElement(chargeElementOptions),
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2016-05-31',
          endDate: '2016-05-31',
          totalDays: 365,
          billableDays: 60,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.16438
        }, {
          ...getChargeElement(chargeElementOptions),
          source: 'supported',
          totalDays: 365,
          billableDays: 182,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.49863
        }];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '31',
        periodEndMonth: '3'
      };
      const returnQuantities1 = [55, 60, 67, 36, 58, 72, 30, 54, 37, 37, 50, 68]; // Apr-Sept total: 348
      const returnQuantities2 = [46, 61, 74, 51, 39, 46, 32, 49, 48, 57, 45, 52]; // Apr-Sept total: 317
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities1
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities2
      })];
      const matchedChargeElements = matchReturnsToChargeElements(wrapElementsInVersion(chargeElements), returns);

      const sumOfRelevantQuantities = returnQuantities1.slice(0, 6).reduce((a, b) => a + b, 0) + returnQuantities2.slice(0, 6).reduce((a, b) => a + b, 0);

      const remainingQuantity = new Decimal(sumOfRelevantQuantities)
        .dividedBy(1000)
        .minus(matchedChargeElements[0].maxAllowableQuantity)
        .minus(matchedChargeElements[1].maxAllowableQuantity)
        .toNumber();

      expect(matchedChargeElements[0].actualAnnualQuantity).to.equal(matchedChargeElements[0].maxAllowableQuantity);
      expect(matchedChargeElements[1].actualAnnualQuantity).to.equal(matchedChargeElements[1].maxAllowableQuantity);
      expect(matchedChargeElements[2].actualAnnualQuantity).to.equal(remainingQuantity);
    });
    test('first three elements are filled before fourth', async () => {
      const chargeElements = [getChargeElement(chargeElementOptions), // pro rata quantity 0.49863
        {
          ...getChargeElement(chargeElementOptions),
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2016-05-31',
          endDate: '2016-05-31',
          totalDays: 365,
          billableDays: 60,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.16438
        }, {
          ...getChargeElement(chargeElementOptions),
          source: 'supported',
          totalDays: 365,
          billableDays: 182,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.49863
        },
        {
          ...getChargeElement(chargeElementOptions),
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2016-05-31',
          source: 'supported',
          endDate: '2016-05-31',
          totalDays: 365,
          billableDays: 60,
          authorisedAnnualQuantity: 1 // pro rata quantity 0.16438
        }];
      const returnOptions = {
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodStartDay: '1',
        periodStartMonth: '4',
        periodEndDay: '31',
        periodEndMonth: '3'
      };
      const returnQuantities1 = [55, 60, 67, 76, 58, 72, 30, 54, 37, 37, 50, 68]; // Apr-Sept total: 388
      const returnQuantities2 = [77, 61, 74, 51, 65, 80, 32, 49, 48, 57, 45, 52]; // Apr-Sept total: 408
      const returnQuantities3 = [52, 71, 68, 73, 66, 57, 32, 49, 48, 57, 45, 52]; // Apr-Sept total: 387
      const returns = [createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities1
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities2
      }), createMonthlyReturn({
        ...returnOptions,
        tertiaryCode: '400',
        quantities: returnQuantities3
      })];
      const matchedChargeElements = matchReturnsToChargeElements(wrapElementsInVersion(chargeElements), returns);

      const sumOfAllocatedQuantities = new Decimal(matchedChargeElements[0].actualAnnualQuantity)
        .plus(matchedChargeElements[1].actualAnnualQuantity)
        .plus(matchedChargeElements[2].actualAnnualQuantity)
        .plus(matchedChargeElements[3].actualAnnualQuantity);

      const remainingQuantity = new Decimal(sumOfAllocatedQuantities)
        .minus(matchedChargeElements[0].maxAllowableQuantity)
        .minus(matchedChargeElements[1].maxAllowableQuantity)
        .minus(matchedChargeElements[2].maxAllowableQuantity)
        .toNumber();

      expect(matchedChargeElements[0].actualAnnualQuantity).to.equal(matchedChargeElements[0].maxAllowableQuantity);
      expect(matchedChargeElements[1].actualAnnualQuantity).to.equal(matchedChargeElements[1].maxAllowableQuantity);
      expect(matchedChargeElements[2].actualAnnualQuantity).to.equal(matchedChargeElements[2].maxAllowableQuantity);
      expect(matchedChargeElements[3].actualAnnualQuantity).to.equal(remainingQuantity);
    });
  });
});
