const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { createChargeElement } = require('../../test-data/test-charge-element-data');
const { createReturn, createLineData, createMonthlyReturn, createPurposeData } = require('../../test-data/test-return-data');
const sandbox = require('sinon').createSandbox();
const Decimal = require('decimal.js-light');
const matchRetQuantities = require('../../../../../src/modules/billing/services/two-part-tariff-service/match-return-quantities');
const {
  matchReturnQuantities,
  prepareChargeElementsForMatching,
  prepareReturnsForMatching,
  matchReturnsToChargeElements
} = require('../../../../../src/modules/billing/services/two-part-tariff-service/two-part-tariff-matching');
const {
  ERROR_NO_RETURNS_FOR_MATCHING,
  ERROR_OVER_ABSTRACTION
} = require('../../../../../src/lib/models/billing-volume').twoPartTariffStatuses;

const roundTo3DP = decimal => {
  return decimal.toDecimalPlaces(3).toNumber();
};

const convertToML = (quantity, round) => {
  return round ? roundTo3DP(new Decimal(quantity).dividedBy(1000)) : new Decimal(quantity).dividedBy(1000).toNumber();
};

experiment('modules/charging/lib/two-part-tariff-matching', async () => {
  experiment('.matchReturnQuantites', async () => {
    beforeEach(async () => {
      sandbox.stub(matchRetQuantities, 'matchReturnLineToElement');
    });
    afterEach(async () => {
      sandbox.restore();
    });
    const chargeElement = [createChargeElement({
      actualReturnQuantity: 0,
      purposeUseCode: 400
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
    test('returns charge element with updated actualReturnQuantity', async () => {
      const ret = [createReturn({
        tertiaryCode: '400',
        quantityAllocated: 0,
        lineData: returnLines
      })];
      matchRetQuantities.matchReturnLineToElement.returns({
        updatedLineQuantityAllocated: 0.05,
        updatedElementQuantity: 0.05
      });
      const matchedChargeElement = matchReturnQuantities(chargeElement, ret);
      expect(matchedChargeElement[0].actualReturnQuantity).to.equal(0.05);
    });
  });
  experiment('.prepareChargeElementsForMatching', async () => {
    const options = {
      authorisedAnnualQuantity: 5,
      startDate: '2018-04-01',
      endDate: '2019-03-31',
      abstractionPeriodStartDay: 1,
      abstractionPeriodStartMonth: 4,
      abstractionPeriodEndDay: 30,
      abstractionPeriodEndMonth: 9,
      totalDays: 365
    };
    const unsupportedChargeElement = createChargeElement({
      ...options,
      chargeElementId: 'unsupported-code-400',
      purposeUseCode: 400,
      source: 'unsupported',
      billableAnnualQuantity: 3.5,
      billableDays: 182
    });
    const unsupportedTLChargeElement = createChargeElement({
      ...options,
      chargeElementId: 'unsupported-TL-code-400',
      purposeUseCode: 400,
      source: 'unsupported',
      timeLimitedStartDate: '2018-03-01',
      timeLimitedEndDate: '2018-09-15',
      billableDays: 160
    });
    const getNonTptChargeElement = code => createChargeElement({
      ...options,
      chargeElementId: `non-tpt-code-${code}`,
      purposeUseCode: code
    });
    test('only returns TPT charge elements', async () => {
      const code200ChargeElement = getNonTptChargeElement(200);
      const code300ChargeElement = getNonTptChargeElement(300);
      const tptChargeElements = prepareChargeElementsForMatching([
        code200ChargeElement,
        unsupportedTLChargeElement,
        code300ChargeElement,
        unsupportedChargeElement
      ]);
      expect(tptChargeElements).to.have.length(2);
      expect(tptChargeElements[0].chargeElementId).to.equal(unsupportedTLChargeElement.chargeElementId);
      expect(tptChargeElements[1].chargeElementId).to.equal(unsupportedChargeElement.chargeElementId);
    });
    test('charge elements have expected data points', async () => {
      const [firstElement, secondElement] = prepareChargeElementsForMatching([
        unsupportedTLChargeElement, // does not have billableAnnualQuantity
        unsupportedChargeElement // has billableAnnualQuantity
      ]);
      expect(firstElement.actualReturnQuantity).to.equal(0);
      expect(firstElement.proRataAuthorisedQuantity).to.be.a.number();

      expect(secondElement.actualReturnQuantity).to.equal(0);
      expect(secondElement.proRataAuthorisedQuantity).to.be.a.number();
    });
    test('charge elements are sorted by billable days in ascending order', async => {
      const supportedChargeElement = createChargeElement({
        ...options,
        chargeElementId: 'supported-code-420',
        purposeUseCode: 420,
        source: 'supported',
        billableDays: 175
      });
      const supportedTLChargeElement = createChargeElement({
        ...options,
        chargeElementId: 'supported-TL-code-420',
        purposeUseCode: 420,
        source: 'supported',
        timeLimitedStartDate: '2018-03-01',
        timeLimitedEndDate: '2018-07-31',
        billableDays: 150
      });
      const sortedChargeElements = prepareChargeElementsForMatching([
        unsupportedChargeElement,
        supportedChargeElement,
        unsupportedTLChargeElement,
        supportedTLChargeElement
      ]);
      expect(sortedChargeElements[0].chargeElementId).to.equal(supportedTLChargeElement.chargeElementId);
      expect(sortedChargeElements[1].chargeElementId).to.equal(unsupportedTLChargeElement.chargeElementId);
      expect(sortedChargeElements[2].chargeElementId).to.equal(supportedChargeElement.chargeElementId);
      expect(sortedChargeElements[3].chargeElementId).to.equal(unsupportedChargeElement.chargeElementId);
    });
  });
  experiment('.prepareReturnsForMatching', async () => {
    const code400Ret = createReturn({
      returnId: 'code-400-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-10-15',
      isUnderQuery: false,
      tertiaryCode: 400
    });
    const code420Ret = createReturn({
      returnId: 'code-420-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-10-15',
      isUnderQuery: false,
      tertiaryCode: 420
    });
    const code260Ret = createReturn({
      returnId: 'code-260-return',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-10-15',
      isUnderQuery: false,
      tertiaryCode: 260
    });
    const code390Ret = createReturn({
      returnId: 'code-600-returns',
      status: 'completed',
      dueDate: '2018-11-01',
      receivedDate: '2018-10-15',
      isUnderQuery: false,
      tertiaryCode: 390
    });

    test('returns an error if .checkReturnsForErrors returns a value', async () => {
      const { error, data } = prepareReturnsForMatching([]);
      expect(data).to.be.null();
      expect(error).to.equal(ERROR_NO_RETURNS_FOR_MATCHING);
    });
    test('only returns TPT returns', async () => {
      const { error, data: tptReturns } = prepareReturnsForMatching([
        code400Ret,
        code420Ret,
        code260Ret,
        code390Ret
      ]);
      expect(error).to.be.null();
      expect(tptReturns).to.have.length(2);
      expect(tptReturns[0].returnId).to.equal(code400Ret.returnId);
      expect(tptReturns[1].returnId).to.equal(code420Ret.returnId);
    });
    test('return lines have expected data points', async () => {
      const quantities = [12, 4, 0, 7, 5, 0, 0, 5, 6];
      const lineData = createLineData('2018-04-01', 'month', quantities);
      const { error, data } = prepareReturnsForMatching([
        {
          ...code400Ret,
          lines: lineData,
          startDate: '2018-04-01',
          endDate: '2018-10-31',
          metadata: {
            ...code400Ret.metadata,
            nald: {
              periodStartDay: 1,
              periodStartMonth: 4,
              periodEndDay: 31,
              periodEndMonth: 10
            }
          }
        }
      ]);
      const { lines } = data[0];

      expect(error).to.be.null();
      expect(lines).to.have.length(4);
      expect(lines[0].quantityAllocated).to.equal(0);
      expect(lines[0].quantity).to.equal(convertToML(quantities[0]));
      expect(lines[1].quantityAllocated).to.equal(0);
      expect(lines[1].quantity).to.equal(convertToML(quantities[1]));
      expect(lines[2].quantityAllocated).to.equal(0);
      expect(lines[2].quantity).to.equal(convertToML(quantities[3]));
      expect(lines[3].quantityAllocated).to.equal(0);
      expect(lines[3].quantity).to.equal(convertToML(quantities[4]));
    });
  });
  experiment('.matchReturnsToChargeElements', async () => {
    const getProRataAuthorisedQuantity = ele => new Decimal(ele.authorisedAnnualQuantity).times(ele.billableDays).dividedBy(ele.totalDays);

    experiment('no returns exist', async () => {
      test('return chargeElements with null actualReturnQuantity', async () => {
        const chargeElements = [
          createChargeElement({ chargeElementId: 'charge-element-1', purposeUseCode: '400' }),
          createChargeElement({ chargeElementId: 'charge-element-2', purposeUseCode: '400' }),
          createChargeElement({ chargeElementId: 'charge-element-3', purposeUseCode: '400' })
        ];
        const returns = [
          createReturn({ status: 'due', tertiaryCode: '400' }),
          createReturn({ status: 'due', tertiaryCode: '400' }),
          createReturn({ status: 'due', tertiaryCode: '400' })
        ];
        const { data: matchedElements } = matchReturnsToChargeElements(chargeElements, returns);

        expect(matchedElements[0].data.chargeElementId).to.equal('charge-element-1');
        expect(matchedElements[0].data.actualReturnQuantity).to.be.null();
        expect(matchedElements[0].error).to.be.null();
        expect(matchedElements[1].data.chargeElementId).to.equal('charge-element-2');
        expect(matchedElements[1].data.actualReturnQuantity).to.be.null();
        expect(matchedElements[1].error).to.be.null();
        expect(matchedElements[2].data.chargeElementId).to.equal('charge-element-3');
        expect(matchedElements[2].data.actualReturnQuantity).to.be.null();
        expect(matchedElements[2].error).to.be.null();
      });
    });
    experiment('allocating quantities to correct charge elements', async () => {
      const chargeElementOptions = {
        chargeElementId: 'charge-element-400-purpose',
        purposeUseCode: 400,
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3,
        source: 'unsupported',
        totalDays: 365,
        billableDays: 182,
        authorisedAnnualQuantity: 5.5
      };
      const returnOptions = {
        status: 'completed',
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: '31',
        periodEndMonth: '3',
        periodStartDay: '1',
        periodStartMonth: '4',
        quantityAllocated: 0
      };
      const chargeElement = [createChargeElement(chargeElementOptions)];
      const secondChargeElement = createChargeElement({
        ...chargeElementOptions,
        chargeElementId: 'charge-element-380-purpose',
        purposeUseCode: 380
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
        const { data: matchedElements } = matchReturnsToChargeElements(chargeElement, [...tptReturns, ...otherPurposeReturns]);
        expect(matchedElements[0].data.actualReturnQuantity).to.equal(0.147);
        expect(matchedElements[0].error).to.be.null();
      });
      test('no quantity is allocated if there are no TPT returns', async () => {
        const { error, data } = matchReturnsToChargeElements(chargeElement, otherPurposeReturns);
        expect(error).to.equal(ERROR_NO_RETURNS_FOR_MATCHING);
        expect(data[0].error).to.be.null();
        expect(data[0].data.chargeElementId).to.equal(chargeElementOptions.chargeElementId);
        expect(data[0].data.actualReturnQuantity).to.be.null();
      });
      test('when there are charge elements and returns with different TPT purposes', async () => {
        const { data: matchedElements, error } = matchReturnsToChargeElements(
          [...chargeElement, secondChargeElement], [...tptReturns, ...otherPurposeReturns]);

        expect(error).to.be.null();
        expect(matchedElements[0].data.actualReturnQuantity).to.equal(0.147);
        expect(matchedElements[0].error).to.be.null();
        expect(matchedElements[1].data.actualReturnQuantity).to.equal(0.052);
        expect(matchedElements[1].error).to.be.null();
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

        const { data: matchedElements, error } = matchReturnsToChargeElements(
          [...chargeElement, secondChargeElement], [...updatedTpTReturns, ...updatedOtherReturns]);

        expect(error).to.be.null();
        expect(matchedElements[0].data.actualReturnQuantity).to.equal(0.147);
        expect(matchedElements[0].error).to.be.null();
        expect(matchedElements[1].data.actualReturnQuantity).to.equal(0.052);
        expect(matchedElements[1].error).to.be.null();
      });
    });

    experiment('allocating correct quantities to charge elements', async () => {
      const chargeElementOptions = {
        purposeUseCode: 400,
        startDate: '2016-10-01',
        endDate: '2017-03-31',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3,
        source: 'unsupported',
        totalDays: 182,
        billableDays: 31,
        billableAnnualQuantity: 0.8,
        authorisedAnnualQuantity: 1
      };
      const returnOptions = {
        status: 'completed',
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        periodEndDay: '31',
        periodEndMonth: '3',
        periodStartDay: '1',
        periodStartMonth: '4',
        quantityAllocated: 0
      };
      const chargeElement = [createChargeElement(chargeElementOptions)];
      test('the full over abstraction amount is put onto the first element', async () => {
        const firstQuantities = [0, 0, 0, 0, 0, 0, 12, 20, 15, 23, 50, 0];
        const secondQuantities = [0, 0, 0, 0, 0, 0, 12, 18, 11, 16, 8, 0];
        const returns = [createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: firstQuantities
        }), createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: secondQuantities
        })];
        const { error, data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
        const totalReturnQuantities = firstQuantities.reduce((a, b) => a + b, 0) + secondQuantities.reduce((a, b) => a + b, 0);
        const expectedactualReturnQuantity = convertToML(totalReturnQuantities, true);
        expect(error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedactualReturnQuantity);
        expect(matchedChargeElement.error).to.equal(ERROR_OVER_ABSTRACTION);
      });
      test('actualReturnQuantity does not exceed total quantities', async () => {
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
        const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
        const totalReturnQuantities = firstQuantities.reduce((a, b) => a + b, 0) + secondQuantities.reduce((a, b) => a + b, 0);
        const expectedactualReturnQuantity = convertToML(totalReturnQuantities);
        expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedactualReturnQuantity);
        expect(matchedChargeElement.error).to.be.null();
      });
    });

    experiment('allocating quantities in the correct date range', async () => {
      const chargeElementOptions = {
        purposeUseCode: 400,
        startDate: '2016-04-01',
        endDate: '2016-09-30',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3,
        source: 'unsupported',
        totalDays: 365,
        billableDays: 182,
        authorisedAnnualQuantity: 5
      };
      test('return quantities are not applied outside of the charge element date range', async () => {
        const chargeElement = [createChargeElement(chargeElementOptions)];
        const returnOptions = {
          status: 'completed',
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
        const expectedactualReturnQuantity = convertToML(sumOfRelevantQuantities);

        const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
        expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedactualReturnQuantity);
        expect(matchedChargeElement.error).to.be.null();
      });
      test('does not allocate quantities outside the return abstraction period', async () => {
        const chargeElement = [
          createChargeElement({
            ...chargeElementOptions,
            endDate: '2017-03-31'
          })];
        const returnOptions = {
          status: 'completed',
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
        const expectedactualReturnQuantity = convertToML(sumOfRelevantQuantities);

        const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
        expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedactualReturnQuantity);
        expect(matchedChargeElement.error).to.be.null();
      });
      test('does not allocate quantities outside the charge elements abstraction period', async () => {
        const chargeElement = [
          createChargeElement({
            ...chargeElementOptions,
            abstractionPeriodEndDay: 31,
            abstractionPeriodEndMonth: 8
          })];
        const returnOptions = {
          status: 'completed',
          startDate: '2016-04-01',
          endDate: '2017-03-31',
          periodStartDay: '1',
          periodStartMonth: '4',
          periodEndDay: '31',
          periodEndMonth: '3'
        };
        const returnQuantities = [0, 0, 0, 12, 18, 11, 3, 0, 8, 0, 0, 0]; // Apr-Aug total 30
        const returns = [createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: [0, 0, 0, 0, 0, 0, 0, 17, 22, 50, 0, 0] // Apr-Aug total: 0
        }), createMonthlyReturn({
          ...returnOptions,
          tertiaryCode: '400',
          quantities: returnQuantities
        })];
        const sumOfRelevantQuantities = returnQuantities.slice(0, 5).reduce((a, b) => a + b, 0);
        const expectedActualReturnQuantity = convertToML(sumOfRelevantQuantities);

        const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
        expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedActualReturnQuantity);
        expect(matchedChargeElement.error).to.be.null();
      });
      experiment('where a charge element ends partway through a return line, pro rata quantity is allocated', async () => {
        test('monthly return', async () => {
          const chargeElement = [{
            ...createChargeElement(chargeElementOptions),
            endDate: '2017-01-18'
          }];
          const returnOptions = {
            status: 'completed',
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
          const expectedactualReturnQuantity = convertToML(sumOfRelevantQuantities, true);

          const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
          expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedactualReturnQuantity);
          expect(matchedChargeElement.error).to.be.null();
        });
        test('weekly return', async () => {
          const chargeElement = [{
            ...createChargeElement(chargeElementOptions),
            endDate: '2016-07-12'
          }];
          const returnOptions = {
            status: 'completed',
            startDate: '2016-04-03',
            endDate: '2017-03-31',
            periodStartDay: '1',
            periodStartMonth: '4',
            periodEndDay: '31',
            periodEndMonth: '3'
          };
          const lineData = [
            { startDate: '2016-04-03', endDate: '2016-04-09', quantity: 0 },
            { startDate: '2016-04-10', endDate: '2016-04-16', quantity: 0 },
            { startDate: '2016-04-17', endDate: '2016-04-23', quantity: 0 },
            { startDate: '2016-04-24', endDate: '2016-04-30', quantity: 2 },
            { startDate: '2016-05-01', endDate: '2016-05-07', quantity: 4 },
            { startDate: '2016-05-08', endDate: '2016-05-14', quantity: 3 },
            { startDate: '2016-05-15', endDate: '2016-05-21', quantity: 3 },
            { startDate: '2016-05-22', endDate: '2016-05-28', quantity: 7 },
            { startDate: '2016-05-29', endDate: '2016-06-04', quantity: 2 },
            { startDate: '2016-06-05', endDate: '2016-06-11', quantity: 1 },
            { startDate: '2016-06-12', endDate: '2016-06-18', quantity: 6 },
            { startDate: '2016-06-19', endDate: '2016-06-25', quantity: 8 },
            { startDate: '2016-06-26', endDate: '2016-07-02', quantity: 0 },
            { startDate: '2016-07-03', endDate: '2016-07-09', quantity: 1 },
            { startDate: '2016-07-10', endDate: '2016-07-16', quantity: 4 },
            { startDate: '2016-07-17', endDate: '2016-07-23', quantity: 6 },
            { startDate: '2016-07-24', endDate: '2016-07-30', quantity: 7 },
            { startDate: '2016-07-31', endDate: '2016-08-06', quantity: 0 },
            { startDate: '2016-08-07', endDate: '2016-08-13', quantity: 0 },
            { startDate: '2016-08-14', endDate: '2016-08-20', quantity: 8 },
            { startDate: '2016-08-21', endDate: '2016-08-27', quantity: 1 },
            { startDate: '2016-08-28', endDate: '2016-09-03', quantity: 4 },
            { startDate: '2016-09-04', endDate: '2016-09-10', quantity: 3 },
            { startDate: '2016-09-11', endDate: '2016-09-17', quantity: 2 }
          ];
          const returns = [createReturn({
            ...returnOptions,
            tertiaryCode: '400',
            lineData,
            frequency: 'week'
          })];

          const sumOfRelevantQuantities = lineData.slice(0, 14).reduce((a, b) => a + b.quantity, 0) +
            new Decimal(lineData[14].quantity).times(3).dividedBy(7).toNumber();
          const expectedActualReturnQuantity = convertToML(sumOfRelevantQuantities, true);
          const { data: [matchedChargeElement] } = matchReturnsToChargeElements(chargeElement, returns);
          expect(matchedChargeElement.data.actualReturnQuantity).to.equal(expectedActualReturnQuantity);
          expect(matchedChargeElement.error).to.be.null();
        });
      });
    });

    experiment('allocating quantities to charge elements in correct order', async () => {
      const chargeElementOptions = {
        purposeUseCode: 400,
        startDate: '2016-04-01',
        endDate: '2016-09-30',
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3,
        source: 'unsupported',
        totalDays: 365,
        billableDays: 182,
        authorisedAnnualQuantity: 1
      };
      test('base element is filled up before other elements', async () => {
        const chargeElements = [
          createChargeElement(chargeElementOptions), // pro rata authorised 0.49863
          {
            ...createChargeElement(chargeElementOptions),
            timeLimitedPeriod: {
              endDate: '2016-05-31',
              startDate: '2016-04-01'
            },
            endDate: '2016-05-31',
            totalDays: 365,
            billableDays: 60,
            authorisedAnnualQuantity: 1 // pro rata authorised 0.16438
          }
        ];
        const returnOptions = {
          status: 'completed',
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

        const { data: matchedChargeElements } = matchReturnsToChargeElements(chargeElements, returns);
        const proRataAuthorisedQuantity = getProRataAuthorisedQuantity(chargeElements[0]);

        const sumOfRelevantQuantities = returnQuantities1.slice(0, 6).reduce((a, b) => a + b, 0) + returnQuantities2.slice(0, 6).reduce((a, b) => a + b, 0);
        const timeLimitedQuantity = roundTo3DP(new Decimal(sumOfRelevantQuantities).dividedBy(1000).minus(proRataAuthorisedQuantity));

        expect(matchedChargeElements[0].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantity));
        expect(matchedChargeElements[0].error).to.be.null();
        expect(matchedChargeElements[1].data.actualReturnQuantity).to.equal(timeLimitedQuantity);
        expect(matchedChargeElements[1].error).to.be.null();
      });
      test('first two elements are filled before third', async () => {
        const chargeElements = [
          createChargeElement(chargeElementOptions), // pro rata authorised 0.49863
          {
            ...createChargeElement(chargeElementOptions),
            timeLimitedPeriod: {
              startDate: '2016-04-01',
              endDate: '2016-05-31'
            },
            endDate: '2016-05-31',
            totalDays: 365,
            billableDays: 60,
            authorisedAnnualQuantity: 1 // pro rata authorised 0.16438
          }, {
            ...createChargeElement(chargeElementOptions),
            timeLimitedPeriod: {
              startDate: '2016-06-01',
              endDate: '2017-03-31'
            },
            totalDays: 365,
            billableDays: 304,
            authorisedAnnualQuantity: 1 // pro rata authorised 0.49863
          }
        ];
        const returnOptions = {
          status: 'completed',
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
        const { data: matchedChargeElements } = matchReturnsToChargeElements(chargeElements, returns);
        const proRataAuthorisedQuantityFirstElement = getProRataAuthorisedQuantity(chargeElements[0]);
        const proRataAuthorisedQuantitySecondElement = getProRataAuthorisedQuantity(chargeElements[1]);

        const sumOfRelevantQuantities = returnQuantities1.slice(0, 6).reduce((a, b) => a + b, 0) + returnQuantities2.slice(0, 6).reduce((a, b) => a + b, 0);

        const remainingQuantity = new Decimal(sumOfRelevantQuantities)
          .dividedBy(1000)
          .minus(proRataAuthorisedQuantityFirstElement)
          .minus(proRataAuthorisedQuantitySecondElement);

        expect(matchedChargeElements[0].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantityFirstElement));
        expect(matchedChargeElements[0].error).to.be.null();
        expect(matchedChargeElements[1].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantitySecondElement));
        expect(matchedChargeElements[1].error).to.be.null();
        expect(matchedChargeElements[2].data.actualReturnQuantity).to.equal(roundTo3DP(remainingQuantity));
        expect(matchedChargeElements[2].error).to.be.null();
      });
      test('first three elements are filled before fourth', async () => {
        const chargeElements = [
          {
            ...createChargeElement(chargeElementOptions),
            id: 'base-element'
          }, // pro rata quantity 0.49863
          {
            ...createChargeElement(chargeElementOptions),
            id: 'TL-element-61-days',
            timeLimitedPeriod: {
              startDate: '2016-04-01',
              endDate: '2016-05-31'
            },
            startDate: '2016-04-01',
            endDate: '2016-05-31',
            totalDays: 365,
            billableDays: 61,
            authorisedAnnualQuantity: 1 // pro rata quantity 0.16712
          }, {
            ...createChargeElement(chargeElementOptions),
            id: 'TL-element-30-days',
            timeLimitedPeriod: {
              startDate: '2016-06-01',
              endDate: '2016-06-30'
            },
            startDate: '2016-06-01',
            endDate: '2016-06-30',
            totalDays: 365,
            billableDays: 30,
            authorisedAnnualQuantity: 1 // pro rata quantity 0.08219
          },
          {
            ...createChargeElement(chargeElementOptions),
            id: 'TL-element-92-days',
            timeLimitedPeriod: {
              startDate: '2016-07-01',
              endDate: '2016-09-30'
            },
            startDate: '2016-07-01',
            endDate: '2016-09-30',
            totalDays: 365,
            billableDays: 92,
            authorisedAnnualQuantity: 1 // pro rata quantity 0.25205
          }
        ];
        const returnOptions = {
          status: 'completed',
          startDate: '2016-04-01',
          endDate: '2017-03-31',
          periodStartDay: '1',
          periodStartMonth: '4',
          periodEndDay: '31',
          periodEndMonth: '3'
        };
        const returnQuantities1 = [55, 58, 55, 62, 58, 50, 36, 54, 37, 37, 50, 68]; // Apr-Sept total: 388
        const returnQuantities2 = [53, 55, 52, 51, 46, 49, 38, 49, 48, 57, 45, 52]; // Apr-Sept total: 408
        const returnQuantities3 = [52, 57, 57, 60, 50, 57, 32, 49, 48, 57, 45, 52]; // Apr-Sept total: 387
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
        const { data: matchedChargeElements } = matchReturnsToChargeElements(chargeElements, returns);

        const proRataAuthorisedQuantityFirstElement = getProRataAuthorisedQuantity(chargeElements.filter(ele => ele.id === 'base-element').shift());
        const proRataAuthorisedQuantitySecondElement = getProRataAuthorisedQuantity(chargeElements.filter(ele => ele.id === 'TL-element-30-days').shift());
        const proRataAuthorisedQuantityThirdElement = getProRataAuthorisedQuantity(chargeElements.filter(ele => ele.id === 'TL-element-61-days').shift());

        const sumOfAllocatedQuantities = new Decimal(matchedChargeElements[0].data.actualReturnQuantity)
          .plus(matchedChargeElements[1].data.actualReturnQuantity)
          .plus(matchedChargeElements[2].data.actualReturnQuantity)
          .plus(matchedChargeElements[3].data.actualReturnQuantity);

        const remainingQuantity = new Decimal(sumOfAllocatedQuantities)
          .minus(proRataAuthorisedQuantityFirstElement)
          .minus(proRataAuthorisedQuantitySecondElement)
          .minus(proRataAuthorisedQuantityThirdElement);

        expect(matchedChargeElements[0].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantityFirstElement));
        expect(matchedChargeElements[0].error).to.be.null();
        expect(matchedChargeElements[1].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantitySecondElement));
        expect(matchedChargeElements[1].error).to.be.null();
        expect(matchedChargeElements[2].data.actualReturnQuantity).to.equal(roundTo3DP(proRataAuthorisedQuantityThirdElement));
        expect(matchedChargeElements[2].error).to.be.null();
        expect(matchedChargeElements[3].data.actualReturnQuantity).to.equal(roundTo3DP(remainingQuantity));
        expect(matchedChargeElements[3].error).to.be.null();
      });
    });
  });
});
