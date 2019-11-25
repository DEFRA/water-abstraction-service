const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});

const {
  isTimeLimited,
  getElementsBySource,
  sortElementsInPriorityOrder,
  reallocateQuantitiesInPriorityOrder,
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
  experiment('.getElementsBySource', async () => {
    const unsupportedSourceElement = getChargeElement({ source: 'unsupported' });
    const supportedSourceElement = getChargeElement({ source: 'supported' });
    const unsupportedSourceTLElement = getChargeElement({
      source: 'unsupported',
      timeLimitedStartDate: '2018-01-01',
      timeLimitedEndDate: '2018-12-31' });
    const supportedSourceTLElement = getChargeElement({
      source: 'supported',
      timeLimitedStartDate: '2018-01-01',
      timeLimitedEndDate: '2018-12-31' });
    const chargeElements = [unsupportedSourceElement, supportedSourceElement, unsupportedSourceTLElement, supportedSourceTLElement];
    test('only returns unsupported source elements', async () => {
      const filteredElements = getElementsBySource([...chargeElements, unsupportedSourceElement], 'unsupported', false);
      expect(filteredElements).to.equal([unsupportedSourceElement, unsupportedSourceElement]);
    });
    test('only returns unsupported source time limited elements', async () => {
      const filteredElements = getElementsBySource(chargeElements, 'unsupported', true);
      expect(filteredElements).to.equal([unsupportedSourceTLElement]);
    });
    test('only returns supported source elements', async () => {
      const filteredElements = getElementsBySource(chargeElements, 'supported', false);
      expect(filteredElements).to.equal([supportedSourceElement]);
    });
    test('only returns supported source time limited elements', async () => {
      const filteredElements = getElementsBySource([...chargeElements, supportedSourceTLElement], 'supported', true);
      expect(filteredElements).to.equal([supportedSourceTLElement, supportedSourceTLElement]);
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
  experiment('.reallocateQuantitiesInPriorityOrder', async () => {
    experiment('when all elements are not full', async () => {
      test('move quantity from lower priority element into base element', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualReturnQuantity: 75,
            proRataAuthorisedQuantity: 100
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'supported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 100
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(100);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(75);
      });
      test('moves quantities from lower priority elements filling elements in priority order', async () => {
        const chargeElements = [
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualReturnQuantity: 75,
            proRataAuthorisedQuantity: 100
          }),
          getChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 35,
            proRataAuthorisedQuantity: 50
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(100);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(50);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(10);
      });
      test('actual quantities remain the same if no shuffling is needed', async () => {
        const chargeElements = [
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-3',
            source: 'unsupported',
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 100
          }),
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 20,
            proRataAuthorisedQuantity: 20
          }),
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-1',
            source: 'supported',
            actualReturnQuantity: 10,
            proRataAuthorisedQuantity: 20
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(chargeElements[0].actualReturnQuantity);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(chargeElements[1].actualReturnQuantity);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(chargeElements[2].actualReturnQuantity);
      });
    });
    experiment('when all elements are full', async () => {
      test('the actual quantities are equal to the billable quantities, if provided', async () => {
        const chargeElements = [
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 50,
            proRataBillableQuantity: 50,
            proRataAuthorisedQuantity: 200
          }),
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataBillableQuantity: 50,
            proRataAuthorisedQuantity: 200
          }),
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 100,
            proRataBillableQuantity: 100,
            proRataAuthorisedQuantity: 200
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(chargeElements[1].proRataBillableQuantity);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(chargeElements[0].proRataBillableQuantity);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(chargeElements[2].proRataBillableQuantity);
      });
      test('the actual quantities are equal to the authorised quantities, if no billable quantities provided', async () => {
        const chargeElements = [
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 50
          }),
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 50
          }),
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 100
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(chargeElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(chargeElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(chargeElements[2].proRataAuthorisedQuantity);
      });
    });
    experiment('when there is an over abstraction', async () => {
      test('base element gets overabstraction, other elements are equal to billable quantity', async () => {
        const chargeElements = [
          getChargeElement({ // first priority
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataBillableQuantity: 100,
            proRataAuthorisedQuantity: 200
          }),
          getChargeElement({ // second priority
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 75,
            proRataBillableQuantity: 50,
            proRataAuthorisedQuantity: 200
          }),
          getChargeElement({ // lowest priority
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 100,
            proRataBillableQuantity: 50,
            proRataAuthorisedQuantity: 200
          })
        ];
        const overAbstraction = new Decimal(chargeElements[0].actualReturnQuantity)
          .plus(chargeElements[1].actualReturnQuantity)
          .plus(chargeElements[2].actualReturnQuantity)
          .minus(chargeElements[0].proRataBillableQuantity)
          .minus(chargeElements[1].proRataBillableQuantity)
          .minus(chargeElements[2].proRataBillableQuantity);
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);

        expect(allocatedElements[0].actualReturnQuantity).to.equal(overAbstraction.plus(chargeElements[0].proRataBillableQuantity).toDecimalPlaces(3).toNumber());
        expect(allocatedElements[1].actualReturnQuantity).to.equal(chargeElements[1].proRataBillableQuantity);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(chargeElements[2].proRataBillableQuantity);
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
            actualReturnQuantity: 0,
            proRataAuthorisedQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 0,
            proRataAuthorisedQuantity: 50
          }),
          getChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 0,
            proRataAuthorisedQuantity: 100
          })
        ];
        const { data: allocatedElements } = reallocateQuantitiesInPriorityOrder(chargeElements);
        expect(allocatedElements[0].actualReturnQuantity).to.equal(0);
        expect(allocatedElements[1].actualReturnQuantity).to.equal(0);
        expect(allocatedElements[2].actualReturnQuantity).to.equal(0);
      });
    });
  });
  experiment('.reshuffleQuantities', async () => {
    test('quantities for charge elements with 2 different purposes are allocated appropriately', async () => {
      const purpose400ChargeElements = [
        getChargeElement({
          chargeElementId: 'charge-element-1',
          source: 'unsupported',
          timeLimitedStartDate: '2018-01-01',
          timeLimitedEndDate: '2018-12-31',
          actualReturnQuantity: 75,
          proRataAuthorisedQuantity: 100,
          purposeTertiary: 400
        }),
        getChargeElement({
          chargeElementId: 'charge-element-2',
          source: 'supported',
          actualReturnQuantity: 100,
          proRataAuthorisedQuantity: 100,
          purposeTertiary: 400
        })
      ];
      const purpose420ChargeElements = [
        getChargeElement({
          chargeElementId: 'charge-element-3',
          source: 'supported',
          timeLimitedStartDate: '2018-01-01',
          timeLimitedEndDate: '2018-12-31',
          actualReturnQuantity: 50,
          proRataAuthorisedQuantity: 50,
          purposeTertiary: 420
        }),
        getChargeElement({
          chargeElementId: 'charge-element-4',
          source: 'supported',
          actualReturnQuantity: 80,
          proRataAuthorisedQuantity: 100,
          purposeTertiary: 420
        })
      ];
      const { error, data: reshuffledElements } = reshuffleQuantities([...purpose400ChargeElements, ...purpose420ChargeElements]);

      expect(error).to.be.an.array().and.to.be.empty();
      expect(reshuffledElements[0].chargeElementId).to.equal('charge-element-1');
      expect(reshuffledElements[0].actualReturnQuantity).to.equal(100);
      expect(reshuffledElements[1].chargeElementId).to.equal('charge-element-2');
      expect(reshuffledElements[1].actualReturnQuantity).to.equal(75);
      expect(reshuffledElements[2].chargeElementId).to.equal('charge-element-4');
      expect(reshuffledElements[2].actualReturnQuantity).to.equal(100);
      expect(reshuffledElements[3].chargeElementId).to.equal('charge-element-3');
      expect(reshuffledElements[3].actualReturnQuantity).to.equal(30);
    });
  });
});
