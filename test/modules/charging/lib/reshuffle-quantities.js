const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  isTimeLimited,
  sortElementsInPriorityOrder,
  reshuffleQuantities
} = require('../../../../src/modules/charging/lib/reshuffle-quantities');

experiment('modules/charging/lib/reshuffle-quantities', async () => {
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
