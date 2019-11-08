const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement, wrapElementsInVersion } = require('./test-charge-data');
const { createReturn, createMonthlyReturn, createLineData } = require('./test-return-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  getEffectiveDates,
  prepChargeElements,
  getTPTChargeElements,
  prepareChargeElementsForMatching,
  prepareReturns,
  prepareReturnLines,
  getProRataQuantity,
  doesLineOverlapChargeElementDateRange,
  matchReturnLineToElement,
  isTimeLimited,
  sortElementsInPriorityOrder,
  reshuffleQuantities
} = require('../../../../src/modules/charging/lib/two-part-tariff-helpers');

const createReturnLine = options => {
  return {
    startDate: options.startDate,
    endDate: options.endDate,
    frequency: options.frequency,
    quantity: options.quantity,
    quantityAllocated: options.quantityAllocated
  };
};

experiment('modules/charging/lib/two-part-tariff-helpers', async () => {
  experiment('.getEffectiveDates', async () => {
    experiment('when abs period is within financial year', async () => {
      const chargeElementOptions = {
        abstractionPeriodStartDay: '1',
        abstractionPeriodStartMonth: '4',
        abstractionPeriodEndDay: '31',
        abstractionPeriodEndMonth: '10',
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        totalDays: 214,
        billableDays: 214
      };
      test('when startDate is within abs period, effectiveStartDate = startDate', async () => {
        const chargeElement = getChargeElement({
          ...chargeElementOptions,
          startDate: '2016-10-01',
          abstractionPeriodEndMonth: '3'
        });
        const { effectiveStartDate } = getEffectiveDates(chargeElement);
        expect(effectiveStartDate).to.equal(chargeElement.startDate);
      });
      test('when endDate is within abs period, effectiveEndDate = endDate', async () => {
        const chargeElement = getChargeElement({ ...chargeElementOptions, endDate: '2016-10-15' });
        const { effectiveEndDate } = getEffectiveDates(chargeElement);
        expect(effectiveEndDate).to.equal(chargeElement.endDate);
      });
      test('when startDate is outside abs period, effectiveStartDate = start of abs period', async () => {
        const chargeElement = getChargeElement({ ...chargeElementOptions, startDate: '2016-03-31' });
        const { effectiveStartDate } = getEffectiveDates(chargeElement);
        expect(effectiveStartDate).to.equal('2016-04-01');
      });
      test('when endDate is outside abs period, effectiveEndDate = end of abs period', async () => {
        const chargeElement = getChargeElement(chargeElementOptions);
        const { effectiveEndDate } = getEffectiveDates(chargeElement);
        expect(effectiveEndDate).to.equal('2016-10-31');
      });
    });
    experiment('when abs period straddles the financial year', async () => {
      const chargeElementOptions = {
        abstractionPeriodStartDay: '1',
        abstractionPeriodStartMonth: '11',
        abstractionPeriodEndDay: '30',
        abstractionPeriodEndMonth: '4',
        startDate: '2016-04-01',
        endDate: '2017-03-31',
        totalDays: 214,
        billableDays: 214
      };
      test('when startDate is within abs period, effectiveStartDate = startDate', async () => {
        const chargeElement = getChargeElement({ ...chargeElementOptions, startDate: '2016-11-15' });
        const { effectiveStartDate } = getEffectiveDates(chargeElement);
        expect(effectiveStartDate).to.equal(chargeElement.startDate);
      });
      test('when endDate is within abs period, effectiveEndDate = endDate', async () => {
        const chargeElement = getChargeElement(chargeElementOptions);
        const { effectiveEndDate } = getEffectiveDates(chargeElement);
        expect(effectiveEndDate).to.equal(chargeElement.endDate);
      });
      test('when startDate is outside abs period, effectiveStartDate = start of abs period', async () => {
        const chargeElement = getChargeElement({ ...chargeElementOptions, startDate: '2016-10-01' });
        const { effectiveStartDate } = getEffectiveDates(chargeElement);
        expect(effectiveStartDate).to.equal('2016-11-01');
      });
      test('when endDate is outside abs period, effectiveEndDate = end of abs period', async () => {
        const chargeElement = getChargeElement({ ...chargeElementOptions, endDate: '2016-10-31' });
        const { effectiveEndDate } = getEffectiveDates(chargeElement);
        expect(effectiveEndDate).to.equal('2016-04-30');
      });
    });
  });

  experiment('.prepChargeElements', async () => {
    const chargeElementOptions = {
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '4',
      abstractionPeriodEndDay: '31',
      abstractionPeriodEndMonth: '10',
      startDate: '2016-04-01',
      endDate: '2016-10-31',
      totalDays: 214,
      billableDays: 214
    };
    experiment('maxAllowableQuantity', async () => {
      test('uses billableAnnualQuantity, if provided', () => {
        const chargeElement = [getChargeElement({ ...chargeElementOptions, billableAnnualQuantity: '5.9996' })];
        const [updatedChargeElement] = prepChargeElements(chargeElement);
        expect(updatedChargeElement.maxAllowableQuantity).to.equal(parseFloat(chargeElement[0].billableAnnualQuantity));
      });
      test('uses authorisedAnnualQuantity, if billableAnnualQuantity not provided', () => {
        const chargeElement = [getChargeElement({ ...chargeElementOptions, authorisedAnnualQuantity: '5.4452' })];
        const [updatedChargeElement] = prepChargeElements(chargeElement);
        expect(updatedChargeElement.maxAllowableQuantity).to.equal(parseFloat(chargeElement[0].authorisedAnnualQuantity));
      });
      test('uses billableAnnualQuantity, if authorisedAnnualQuantity also provided', () => {
        const chargeElement = [getChargeElement({
          ...chargeElementOptions,
          authorisedAnnualQuantity: '5.4452',
          billableAnnualQuantity: '5.9996'
        })];
        const [updatedChargeElement] = prepChargeElements(chargeElement);
        expect(updatedChargeElement.maxAllowableQuantity).to.equal(parseFloat(chargeElement[0].billableAnnualQuantity));
      });
      test('pro ratas the authorised quantity if billableDays < totalDays', () => {
        const chargeElement = [getChargeElement({
          ...chargeElementOptions,
          billableAnnualQuantity: '5.9996',
          totalDays: 214,
          billableDays: 150
        })];
        const [updatedChargeElement] = prepChargeElements(chargeElement);
        const expectedMaxAllowableQuantity = new Decimal(chargeElement[0].billableAnnualQuantity)
          .times(chargeElement[0].billableDays)
          .dividedBy(chargeElement[0].totalDays)
          .toNumber();
        expect(updatedChargeElement.maxAllowableQuantity).to.equal(expectedMaxAllowableQuantity);
      });
    });
    experiment('actualAnnualQuantity', async () => {
      test('is set to 0', () => {
        const [updatedChargeElement] = prepChargeElements([getChargeElement({ ...chargeElementOptions, billableAnnualQuantity: '5.9996' })]);
        expect(updatedChargeElement.actualAnnualQuantity).to.equal(0);
      });
    });
  });

  experiment('.getTPTChargeElements', async () => {
    const chargeElementOptions = {
      actualAnnualQuantity: 0,
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '4',
      abstractionPeriodEndDay: '31',
      abstractionPeriodEndMonth: '10',
      startDate: '2016-04-01',
      endDate: '2016-10-31',
      billableAnnualQuantity: 5.9996,
      maxAllowableQuantity: 5.9996,
      totalDays: 214,
      billableDays: 214,
      effectiveEndDate: '2016-10-31',
      effectiveStartDate: '2016-04-01'
    };
    test('only returns charge elements with TPT purposes', async () => {
      const chargeElementsWithTPTPurposes = [
        getChargeElement({ purposeTertiary: 380, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 410, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 420, ...chargeElementOptions })
      ];
      const chargeElementsWithOtherPurposes = [
        getChargeElement({ purposeTertiary: 200, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 180, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 620, ...chargeElementOptions })
      ];
      const chargeVersion = wrapElementsInVersion([
        ...chargeElementsWithTPTPurposes,
        ...chargeElementsWithOtherPurposes
      ], '2019-04-01', '2019-08-31');
      const filteredElements = getTPTChargeElements(chargeVersion);
      expect(filteredElements).to.equal(chargeElementsWithTPTPurposes);
    });
    test('returns empty array if no TPT charge elements present', async () => {
      const nonTPTChargeElements = [
        getChargeElement({ purposeTertiary: 200, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 180, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 620, ...chargeElementOptions })
      ];
      const chargeVersion = wrapElementsInVersion(nonTPTChargeElements, '2019-04-01', '2019-08-31');
      const filteredElements = getTPTChargeElements(chargeVersion);
      expect(filteredElements).to.be.empty().and.to.be.an.array();
    });
  });

  experiment('.prepareChargeElementsForMatching', async () => {
    test('sorts the charge elements by billableDays', async () => {
      const chargeElements = [
        getChargeElement({ billableDays: 180 }),
        getChargeElement({ billableDays: 56 }),
        getChargeElement({ billableDays: 352 })
      ];
      const sortedElements = prepareChargeElementsForMatching(chargeElements);
      expect(sortedElements).to.be.equal([
        getChargeElement({ billableDays: 56 }),
        getChargeElement({ billableDays: 180 }),
        getChargeElement({ billableDays: 352 })

      ]);
    });
  });

  experiment('.prepareReturns', async () => {
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
      const filteredReturns = prepareReturns(returns);
      expect(filteredReturns).to.equal(tptReturns);
    });
    test('returns an empty array if no TPT returns available', async () => {
      const returns = [
        createReturn({ tertiaryCode: 186 }),
        createReturn({ tertiaryCode: 260 })
      ];
      const filteredReturns = prepareReturns(returns);
      expect(filteredReturns).to.be.an.array().and.to.be.empty();
    });
  });

  experiment('.prepareReturnLines', async () => {
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
      const [{ lines }] = prepareReturnLines([ret]);
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
      const [{ lines }] = prepareReturnLines([ret]);
      const returnLines = ret.lines.slice(0, 7);
      expect(lines).to.equal(getPreparedLines(returnLines));
    });
  });

  experiment('.getProRataQuantity', async () => {
    experiment('when return line is completely within charge element', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2016-04-30',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      test('returns entire quantity as Decimal', async () => {
        const returnLine = createReturnLine({
          startDate: '2016-04-03',
          endDate: '2016-04-09',
          quantityAllocated: 0,
          quantity: 0.02269 });
        const proRataQuantity = getProRataQuantity(returnLine, chargeElement);
        const quantityDecimal = new Decimal(returnLine.quantity);
        expect(proRataQuantity).to.equal(quantityDecimal);
      });
    });
    experiment('when return line is partially within charge element', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2016-04-30',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      test('proRataQuantity will be proportionate to quantity based on overlap', async () => {
        const returnLine = createReturnLine({
          startDate: '2016-03-27',
          endDate: '2016-04-02',
          quantityAllocated: 0,
          quantity: 0.02269
        });
        const proRataQuantity = getProRataQuantity(returnLine, chargeElement);
        const expectedProRataQuantity = new Decimal(returnLine.quantity).times(2).dividedBy(7);
        expect(proRataQuantity).to.equal(expectedProRataQuantity);
      });
    });
  });

  experiment('.doesLineOverlapChargeElementDateRange', async () => {
    test('returns true when line is completely within charge element date range', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const returnLine = createReturnLine({ startDate: '2016-05-01', endDate: '2016-05-31' });
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      expect(doesLineOverlapChargeElementDateRange(returnLine, chargeElement)).to.be.true();
    });
    test('returns true when line range is the same as charge element date range', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2016-04-30',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const returnLine = createReturnLine({ startDate: '2016-04-01', endDate: '2016-04-30' });
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      expect(doesLineOverlapChargeElementDateRange(returnLine, chargeElement)).to.be.true();
    });
    test('returns true when line range is partially in charge element date range', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2016-04-30',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const returnLine = createReturnLine({ startDate: '2016-03-27', endDate: '2016-04-02' });
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      expect(doesLineOverlapChargeElementDateRange(returnLine, chargeElement)).to.be.true();
    });
    test('returns false when line range is adjacent to change element date range', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2016-04-30',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const returnLine = createReturnLine({ startDate: '2016-05-01', endDate: '2016-05-31' });
      const chargeElement = getChargeElement({ ...chargeElementOptions });
      expect(doesLineOverlapChargeElementDateRange(returnLine, chargeElement)).to.be.false();
    });
  });

  experiment('.matchReturnLineToElement', async () => {
    experiment('if return line and charge element have no overlap', async () => {
      test('return line quantityAllocated and charge element actualAnnualQuantity remain the same', async () => {
        const returnLine = createReturnLine({
          startDate: '2016-04-01',
          endDate: '2016-04-30',
          quantity: 0.02269,
          quantityAllocated: 0
        });
        const chargeElement = getChargeElement({
          effectiveStartDate: '2016-05-01',
          effectiveEndDate: '2017-04-30',
          billableAnnualQuantity: 5.9996,
          actualAnnualQuantity: 0,
          totalDays: 214,
          billableDays: 214
        });
        const { updatedElementQuantity, updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualAnnualQuantity);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantityAllocated);
      });
    });
    experiment('if entire line quantity is allocated', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualAnnualQuantity: 1.3,
        maxAllowableQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      const quantityDecimal = new Decimal(returnLine.quantity);
      test('adds proRataQuantity to actualAnnualQuantity in charge element', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(quantityDecimal.plus(chargeElement.actualAnnualQuantity).toNumber());
      });
      test('adds proRataQuantity to quantityAllocated in return line', async () => {
        const { updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(quantityDecimal.toNumber());
      });
    });
    experiment('if quantity allocated fills charge element to maxAllowabaleQuantity', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualAnnualQuantity: 5.99,
        maxAllowableQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('allocates only enough quantity to take actualAnnualQuantity to maxAllowableQuantity', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.maxAllowableQuantity);
      });
      test('quantityAllocated in return line reflects how much quantity was allocated', async () => {
        const { updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(
          new Decimal(chargeElement.maxAllowableQuantity).minus(chargeElement.actualAnnualQuantity).toNumber()
        );
      });
    });
    experiment('if some of the quantity has already been allocated', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0.02
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualAnnualQuantity: 2,
        maxAllowableQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      const quantityToBeAllocated = new Decimal(returnLine.quantity).minus(returnLine.quantityAllocated);
      test('only allocates unallocatedQuantity', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(
          new Decimal(chargeElement.actualAnnualQuantity).plus(quantityToBeAllocated).toNumber()
        );
      });
      test('quantityAllocated is never greater than proRataQuantity', async () => {
        const { updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantity);
      });
    });
    experiment('if charge element is at maxAllowableQuantity', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualAnnualQuantity: 5.9996,
        maxAllowableQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('charge element actualAnnualQuantity remains the same', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualAnnualQuantity);
      });
      test('quantityAllocated remains the same', async () => {
        const { updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantityAllocated);
      });
    });
    experiment('if quantityAllocated has already been allocated', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0.02269
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualAnnualQuantity: 0,
        maxAllowableQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('charge element actualAnnualQuantity remains the same', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualAnnualQuantity);
      });
      test('quantityAllocated remains the same', async () => {
        const { updatedLineQuantityAllocated } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantityAllocated);
      });
    });
  });
  experiment('.isTimeLimited', async () => {
    test('returns false if timeLimited start & end dates are null', async () => {
      const result = isTimeLimited(getChargeElement({
        timeLimitedStartDate: null,
        timeLimitedEndDate: null
      }));
      expect(result).to.be.false();
    });
    test('returns false if timeLimited start & end dates are undefined', async () => {
      const result = isTimeLimited(getChargeElement({}));
      expect(result).to.be.false();
    });
    test('returns true if timeLimited start & end dates are dates', async () => {
      const result = isTimeLimited(getChargeElement({
        timeLimitedStartDate: '2016-04-01',
        timeLimitedEndDate: '2017-03-31'
      }));
      expect(result).to.be.true();
    });
  });

  experiment('.sortElementsInPriorityOrder', async () => {
    test('unsupported source is prioritised over supported source', async () => {
      const chargeElements = [
        getChargeElement({
          chargeElementId: 'charge-element-1',
          source: 'supported',
          timeLimitedStartDate: null,
          timeLimitedEndDate: null
        }),
        getChargeElement({
          chargeElementId: 'charge-element-2',
          source: 'unsupported',
          timeLimitedStartDate: null,
          timeLimitedEndDate: null
        })
      ];
      const prioritisedElements = sortElementsInPriorityOrder(chargeElements);
      expect(prioritisedElements[0].chargeElementId).to.equal('charge-element-2');
      expect(prioritisedElements[1].chargeElementId).to.equal('charge-element-1');
    });
    test('unsupported source time-limited element prioritised over "regular" supported source element', async () => {
      const chargeElements = [
        getChargeElement({
          chargeElementId: 'charge-element-1',
          source: 'supported',
          timeLimitedStartDate: null,
          timeLimitedEndDate: null
        }),
        getChargeElement({
          chargeElementId: 'charge-element-2',
          source: 'unsupported',
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2017-03-31'
        })
      ];
      const prioritisedElements = sortElementsInPriorityOrder(chargeElements);
      expect(prioritisedElements[0].chargeElementId).to.equal('charge-element-2');
      expect(prioritisedElements[1].chargeElementId).to.equal('charge-element-1');
    });
    test('supported source "regular" element is prioritised over supported source time-limited element', async () => {
      const chargeElements = [
        getChargeElement({
          chargeElementId: 'charge-element-1',
          source: 'supported',
          timeLimitedStartDate: '2016-04-01',
          timeLimitedEndDate: '2017-03-31'
        }),
        getChargeElement({
          chargeElementId: 'charge-element-2',
          source: 'supported',
          timeLimitedStartDate: null,
          timeLimitedEndDate: null
        })
      ];
      const prioritisedElements = sortElementsInPriorityOrder(chargeElements);
      expect(prioritisedElements[0].chargeElementId).to.equal('charge-element-2');
      expect(prioritisedElements[1].chargeElementId).to.equal('charge-element-1');
    });
    experiment('have 2 equal priority elements', async () => {
      test('sort by billable days in descending order', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            billableDays: 56
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            billableDays: 150
          })
        ];
        const prioritisedElements = sortElementsInPriorityOrder(chargeElements);
        expect(prioritisedElements[0].chargeElementId).to.equal('charge-element-2');
        expect(prioritisedElements[1].chargeElementId).to.equal('charge-element-1');
      });
    });
  });
  experiment('.reshuffleQuantities', async () => {
    experiment('when all elements are not full', async () => {
      test('move quantity from lower priority element into base element', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 75,
            maxAllowableQuantity: 100
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 100,
            maxAllowableQuantity: 100
          })
        ];
        const reshuffledElements = reshuffleQuantities(chargeElements);
        expect(reshuffledElements[0].actualAnnualQuantity).to.equal(100);
        expect(reshuffledElements[1].actualAnnualQuantity).to.equal(75);
      });
      test('moves quantities from lower priority elements filling elements in priority order', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualAnnualQuantity: 50,
            maxAllowableQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 75,
            maxAllowableQuantity: 100
          }),
          getChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 35,
            maxAllowableQuantity: 50
          })
        ];
        const reshuffledElements = reshuffleQuantities(chargeElements);
        expect(reshuffledElements[0].actualAnnualQuantity).to.equal(100);
        expect(reshuffledElements[1].actualAnnualQuantity).to.equal(50);
        expect(reshuffledElements[2].actualAnnualQuantity).to.equal(10);
      });
      test('actual quantities remain the same if no shuffling is needed', async () => {
        const chargeElements = [
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-1',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 10,
            maxAllowableQuantity: 20
          }),
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualAnnualQuantity: 20,
            maxAllowableQuantity: 20
          }),
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-3',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 100,
            maxAllowableQuantity: 100
          })
        ];
        const reshuffledElements = reshuffleQuantities(chargeElements);
        expect(reshuffledElements[0].actualAnnualQuantity).to.equal(chargeElements[2].actualAnnualQuantity);
        expect(reshuffledElements[1].actualAnnualQuantity).to.equal(chargeElements[1].actualAnnualQuantity);
        expect(reshuffledElements[2].actualAnnualQuantity).to.equal(chargeElements[0].actualAnnualQuantity);
      });
    });
    experiment('when all elements are full', async () => {
      test('the actual quantities are equal to the max allowable quantities', async () => {
        const chargeElements = [
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualAnnualQuantity: 50,
            maxAllowableQuantity: 50
          }),
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 50,
            maxAllowableQuantity: 50
          }),
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-3',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 100,
            maxAllowableQuantity: 100
          })
        ];
        const reshuffledElements = reshuffleQuantities(chargeElements);
        expect(reshuffledElements[0].actualAnnualQuantity).to.equal(chargeElements[1].maxAllowableQuantity);
        expect(reshuffledElements[1].actualAnnualQuantity).to.equal(chargeElements[0].maxAllowableQuantity);
        expect(reshuffledElements[2].actualAnnualQuantity).to.equal(chargeElements[2].maxAllowableQuantity);
      });
    });
    experiment('when the total quantities sum to zero', async () => {
      test('all actual quantities should remain as zero', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualAnnualQuantity: 0,
            maxAllowableQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 0,
            maxAllowableQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualAnnualQuantity: 0,
            maxAllowableQuantity: 100
          })
        ];
        const reshuffledElements = reshuffleQuantities(chargeElements);
        expect(reshuffledElements[0].actualAnnualQuantity).to.equal(0);
        expect(reshuffledElements[1].actualAnnualQuantity).to.equal(0);
        expect(reshuffledElements[2].actualAnnualQuantity).to.equal(0);
      });
    });
  });
});
