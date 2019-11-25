const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  getProRataQuantity,
  doesLineOverlapChargeElementDateRange,
  matchReturnLineToElement
} = require('../../../../src/modules/charging/lib/match-return-quantities');

const createReturnLine = options => {
  return {
    startDate: options.startDate,
    endDate: options.endDate,
    frequency: options.frequency,
    quantity: options.quantity,
    quantityAllocated: options.quantityAllocated
  };
};

experiment('modules/charging/lib/match-return-quantities', async () => {
  experiment('.doesLineOverlapChargeElementDateRange', async () => {
    test('returns true when line is completely within charge element date range', async () => {
      const chargeElementOptions = {
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        billableAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      };
      const returnLine = createReturnLine({
        startDate: '2016-05-01',
        endDate: '2016-05-31'
      });
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
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
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30'
      });
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
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
      const returnLine = createReturnLine({
        startDate: '2016-03-27',
        endDate: '2016-04-02'
      });
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
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
      const returnLine = createReturnLine({
        startDate: '2016-05-01',
        endDate: '2016-05-31'
      });
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
      expect(doesLineOverlapChargeElementDateRange(returnLine, chargeElement)).to.be.false();
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
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
      test('returns entire quantity as Decimal', async () => {
        const returnLine = createReturnLine({
          startDate: '2016-04-03',
          endDate: '2016-04-09',
          quantityAllocated: 0,
          quantity: 0.02269
        });
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
      const chargeElement = getChargeElement({
        ...chargeElementOptions
      });
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

  experiment('.matchReturnLineToElement', async () => {
    experiment('if return line and charge element have no overlap', async () => {
      test('return line quantityAllocated and charge element actualReturnQuantity remain the same', async () => {
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
          actualReturnQuantity: 0,
          totalDays: 214,
          billableDays: 214
        });
        const {
          updatedElementQuantity,
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualReturnQuantity);
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
        actualReturnQuantity: 1.3,
        authorisedAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      const quantityDecimal = new Decimal(returnLine.quantity);
      test('adds proRataQuantity to actualReturnQuantity in charge element', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(quantityDecimal.plus(chargeElement.actualReturnQuantity).toNumber());
      });
      test('adds proRataQuantity to quantityAllocated in return line', async () => {
        const {
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(quantityDecimal.toNumber());
      });
    });
    experiment('if quantity allocated fills charge element to authorisedAnnualQuantity', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualReturnQuantity: 5.99,
        authorisedAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('allocates only enough quantity to take actualReturnQuantity to authorisedAnnualQuantity', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.authorisedAnnualQuantity);
      });
      test('quantityAllocated in return line reflects how much quantity was allocated', async () => {
        const {
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(
          new Decimal(chargeElement.authorisedAnnualQuantity).minus(chargeElement.actualReturnQuantity).toNumber()
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
        actualReturnQuantity: 2,
        authorisedAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      const quantityToBeAllocated = new Decimal(returnLine.quantity).minus(returnLine.quantityAllocated);
      test('only allocates unallocatedQuantity', async () => {
        const { updatedElementQuantity } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(
          new Decimal(chargeElement.actualReturnQuantity).plus(quantityToBeAllocated).toNumber()
        );
      });
      test('quantityAllocated is never greater than proRataQuantity', async () => {
        const {
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantity);
      });
    });
    experiment('if charge element is at authorisedAnnualQuantity', async () => {
      const returnLine = createReturnLine({
        startDate: '2016-04-01',
        endDate: '2016-04-30',
        quantity: 0.02269,
        quantityAllocated: 0
      });
      const chargeElement = getChargeElement({
        effectiveStartDate: '2016-04-01',
        effectiveEndDate: '2017-03-31',
        actualReturnQuantity: 5.9996,
        authorisedAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('charge element actualReturnQuantity remains the same', async () => {
        const {
          updatedElementQuantity
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualReturnQuantity);
      });
      test('quantityAllocated remains the same', async () => {
        const {
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
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
        actualReturnQuantity: 0,
        authorisedAnnualQuantity: 5.9996,
        totalDays: 214,
        billableDays: 214
      });
      test('charge element actualReturnQuantity remains the same', async () => {
        const {
          updatedElementQuantity
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedElementQuantity).to.equal(chargeElement.actualReturnQuantity);
      });
      test('quantityAllocated remains the same', async () => {
        const {
          updatedLineQuantityAllocated
        } = matchReturnLineToElement(returnLine, chargeElement);
        expect(updatedLineQuantityAllocated).to.equal(returnLine.quantityAllocated);
      });
    });
  });
});
