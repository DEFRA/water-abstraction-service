'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createChargeElement } = require('../../test-data/test-charge-element-data');
const Decimal = require('decimal.js-light');
const {
  reallocateQuantitiesInOrder,
  isTimeLimited,
  isSubElementWithinBaseElement,
  sortElementsIntoGroupsForReallocation,
  checkQuantitiesInElementGroups,
  reshuffleQuantities
} = require('../../../../../src/modules/billing/services/two-part-tariff-service/reshuffle-quantities');
const { ERROR_OVER_ABSTRACTION } = require('../../../../../src/lib/models/transaction').twoPartTariffStatuses;
const { CHARGE_SEASON } = require('../../../../../src/lib/models/constants');

experiment('modules/charging/lib/reshuffle-quantities', async () => {
  experiment('.reallocateQuantitiesInOrder', async () => {
    experiment('when all elements are not full', async () => {
      test('move quantity from sub element into base element', async () => {
        const chargeElementGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualReturnQuantity: 75,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 100
          }),
          subElements: [createChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: '2018-01-01',
            timeLimitedEndDate: '2018-06-30',
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 100
          })
          ]
        };
        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(2);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(100);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(100);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(75);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(100);
        expect(allocatedElements[1].error).to.be.null();
      });
      test('moves quantities from sub elements filling elements in order passed', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-base',
            source: 'unsupported',
            timeLimitedStartDate: null,
            timeLimitedEndDate: null,
            actualReturnQuantity: 75,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 100
          }),
          subElements: [
            createChargeElement({
              chargeElementId: 'charge-element-1',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2016-10-31',
              actualReturnQuantity: 50,
              proRataAuthorisedQuantity: 50,
              maxPossibleReturnQuantity: 100
            }),
            createChargeElement({
              chargeElementId: 'charge-element-2',
              source: 'unsupported',
              timeLimitedStartDate: '2016-11-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 35,
              proRataAuthorisedQuantity: 50,
              maxPossibleReturnQuantity: 100
            })
          ]
        };
        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(3);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(100);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(100);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(50);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[1].error).to.be.null();
        expect(allocatedElements[2].data.actualReturnQuantity).to.equal(10);
        expect(allocatedElements[2].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[2].error).to.be.null();
      });
      test('actual quantities remain the same if no shuffling is needed', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'unsupported',
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 100
          }),
          subElements: [
            createChargeElement({
              chargeElementId: 'charge-element-2',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 20,
              proRataAuthorisedQuantity: 20,
              maxPossibleReturnQuantity: 100
            }),
            createChargeElement({
              chargeElementId: 'charge-element-1',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 10,
              proRataAuthorisedQuantity: 20,
              maxPossibleReturnQuantity: 100
            })
          ]
        };
        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(3);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(chargeElementsGroup.baseElement.actualReturnQuantity);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(100);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[0].actualReturnQuantity);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(20);
        expect(allocatedElements[1].error).to.be.null();
        expect(allocatedElements[2].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[1].actualReturnQuantity);
        expect(allocatedElements[2].data.proRataAuthorisedQuantity).to.equal(20);
        expect(allocatedElements[2].error).to.be.null();
      });
    });
    experiment('when all elements are full', async () => {
      test('the actual quantities are equal to the billable quantities, if provided', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 200
          }),
          subElements: [
            createChargeElement({
              chargeElementId: 'charge-element-1',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 50,
              proRataAuthorisedQuantity: 50,
              maxPossibleReturnQuantity: 200
            }),
            createChargeElement({
              chargeElementId: 'charge-element-3',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 100,
              proRataAuthorisedQuantity: 100,
              maxPossibleReturnQuantity: 200
            })
          ]
        };
        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(3);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(chargeElementsGroup.baseElement.proRataAuthorisedQuantity);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.baseElement.proRataAuthorisedQuantity);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[1].error).to.be.null();
        expect(allocatedElements[2].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[2].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[2].error).to.be.null();
      });
      test('the actual quantities are equal to the authorised quantities, if no billable quantities provided', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-base',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 100
          }),
          subElements: [
            createChargeElement({
              chargeElementId: 'charge-element-1',
              source: 'unsupported',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              actualReturnQuantity: 50,
              proRataAuthorisedQuantity: 50,
              maxPossibleReturnQuantity: 100
            }),
            createChargeElement({
              chargeElementId: 'charge-element-2',
              timeLimitedStartDate: '2016-04-01',
              timeLimitedEndDate: '2017-03-31',
              source: 'unsupported',
              actualReturnQuantity: 100,
              proRataAuthorisedQuantity: 100,
              maxPossibleReturnQuantity: 100
            })
          ]
        };
        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(3);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(chargeElementsGroup.baseElement.proRataAuthorisedQuantity);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[1].error).to.be.null();
        expect(allocatedElements[2].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[2].data.proRataAuthorisedQuantity).to.equal(100);
        expect(allocatedElements[2].error).to.be.null();
      });
    });
    experiment('when there is an over abstraction', async () => {
      test('base element gets overabstraction, sub elements are equal to billable quantity', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            actualReturnQuantity: 50,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 200
          }),
          subElements: [createChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 75,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 200
          }),
          createChargeElement({
            chargeElementId: 'charge-element-3',
            source: 'supported',
            actualReturnQuantity: 100,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 200
          })
          ]
        };
        const overAbstraction = new Decimal(chargeElementsGroup.baseElement.actualReturnQuantity)
          .plus(chargeElementsGroup.subElements[0].actualReturnQuantity)
          .plus(chargeElementsGroup.subElements[1].actualReturnQuantity)
          .minus(chargeElementsGroup.baseElement.proRataAuthorisedQuantity)
          .minus(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity)
          .minus(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);

        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(allocatedElements).to.be.an.array().and.to.have.length(3);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(overAbstraction.plus(chargeElementsGroup.baseElement.proRataAuthorisedQuantity).toDecimalPlaces(3).toNumber());
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.baseElement.proRataAuthorisedQuantity);
        expect(allocatedElements[0].error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.subElements[0].proRataAuthorisedQuantity);
        expect(allocatedElements[1].error).to.be.null();
        expect(allocatedElements[2].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(chargeElementsGroup.subElements[1].proRataAuthorisedQuantity);
        expect(allocatedElements[2].error).to.be.null();
      });
      test('and an under abstraction in sub element, sub element is equal to max for period, excess is put on base element', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            actualReturnQuantity: 110,
            proRataAuthorisedQuantity: 100,
            maxPossibleReturnQuantity: 156
          }),
          subElements: [createChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 46,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 46
          })
          ]
        };

        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(allocatedElements).to.be.an.array().and.to.have.length(2);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(chargeElementsGroup.baseElement.actualReturnQuantity);
        expect(allocatedElements[0].error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(chargeElementsGroup.subElements[0].maxPossibleReturnQuantity);
        expect(allocatedElements[1].error).to.be.null();
      });
    });
    experiment('when the total quantities sum to zero', async () => {
      test('all actual quantities should remain as zero', async () => {
        const chargeElementsGroup = {
          baseElement: createChargeElement({
            chargeElementId: 'charge-element-1',
            source: 'unsupported',
            actualReturnQuantity: 0,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 100
          }),
          subElements: [createChargeElement({
            chargeElementId: 'charge-element-2',
            source: 'unsupported',
            timeLimitedStartDate: '2016-04-01',
            timeLimitedEndDate: '2017-03-31',
            actualReturnQuantity: 0,
            proRataAuthorisedQuantity: 50,
            maxPossibleReturnQuantity: 100
          })]
        };

        const { error, data: allocatedElements } = reallocateQuantitiesInOrder(chargeElementsGroup);

        expect(error).to.be.null();
        expect(allocatedElements).to.be.an.array().and.to.have.length(2);
        expect(allocatedElements[0].data.actualReturnQuantity).to.equal(0);
        expect(allocatedElements[0].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[0].error).to.be.null();
        expect(allocatedElements[1].data.actualReturnQuantity).to.equal(0);
        expect(allocatedElements[1].data.proRataAuthorisedQuantity).to.equal(50);
        expect(allocatedElements[1].error).to.be.null();
      });
    });
  });
  experiment('.isTimeLimited', async () => {
    test('returns false if timeLimited start & end dates are null', async () => {
      const result = isTimeLimited(createChargeElement({
        timeLimitedStartDate: null,
        timeLimitedEndDate: null
      }));
      expect(result).to.be.false();
    });
    test('returns false if timeLimited start & end dates are undefined', async () => {
      const result = isTimeLimited(createChargeElement({}));
      expect(result).to.be.false();
    });
    test('returns true if timeLimited start & end dates are dates', async () => {
      const result = isTimeLimited(createChargeElement({
        timeLimitedStartDate: '2016-04-01',
        timeLimitedEndDate: '2017-03-31'
      }));
      expect(result).to.be.true();
    });
  });
  experiment('.isSubElementWithinBaseElement', async () => {
    const baseElement = createChargeElement({
      abstractionPeriodStartDay: 1,
      abstractionPeriodStartMonth: 4,
      abstractionPeriodEndDay: 31,
      abstractionPeriodEndMonth: 10
    });
    test('returns true if sub element has same abs period as base element', async () => {
      const subElement = createChargeElement({
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10,
        startDate: '2018-04-01'
      });

      expect(isSubElementWithinBaseElement(subElement, baseElement)).to.be.true();
    });
    test('returns true if sub element is within base element abs period', async () => {
      const subElement = createChargeElement({
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 5,
        abstractionPeriodEndDay: 30,
        abstractionPeriodEndMonth: 9,
        startDate: '2018-05-01'
      });

      expect(isSubElementWithinBaseElement(subElement, baseElement)).to.be.true();
    });
    test('returns false if sub element abs period is larger than base element', async () => {
      const subElement = createChargeElement({
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 3,
        abstractionPeriodEndDay: 30,
        abstractionPeriodEndMonth: 11,
        startDate: '2018-03-01'
      });

      expect(isSubElementWithinBaseElement(subElement, baseElement)).to.be.false();
    });
    test('returns false if start of sub element abs period is before base element abs period', async () => {
      const subElement = createChargeElement({
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 3,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10,
        startDate: '2018-03-01'
      });

      expect(isSubElementWithinBaseElement(subElement, baseElement)).to.be.false();
    });
    test('returns false if end of sub element abs period is after base element abs period', async () => {
      const subElement = createChargeElement({
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 30,
        abstractionPeriodEndMonth: 11,
        startDate: '2018-04-01'
      });

      expect(isSubElementWithinBaseElement(subElement, baseElement)).to.be.false();
    });
  });
  experiment('.sortElementsIntoGroupsForReallocation', async () => {
    test('base elements are not grouped together', async () => {
      const baseElement1 = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10
      });
      const baseElement2 = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 1,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3
      });
      const reshufflingGroups = sortElementsIntoGroupsForReallocation([baseElement1, baseElement2]);

      expect(reshufflingGroups[0].baseElement).to.equal(baseElement1);
      expect(reshufflingGroups[0].subElements).to.be.an.array().and.to.be.empty();
      expect(reshufflingGroups[1].baseElement).to.equal(baseElement2);
      expect(reshufflingGroups[1].subElements).to.be.an.array().and.to.be.empty();
    });
    test('time limited element is grouped with the correct base element', async () => {
      const baseElement1 = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10
      });
      const baseElement2 = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 1,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 3
      });
      const subElement = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10,
        startDate: '2018-04-01',
        timeLimitedStartDate: '2015-04-01',
        timeLimitedEndDate: '2020-03-31'
      });
      const reshufflingGroups = sortElementsIntoGroupsForReallocation([baseElement1, baseElement2, subElement]);

      expect(reshufflingGroups[0].baseElement).to.equal(baseElement1);
      expect(reshufflingGroups[0].subElements[0]).to.equal(subElement);
      expect(reshufflingGroups[1].baseElement).to.equal(baseElement2);
      expect(reshufflingGroups[1].subElements).to.be.an.array().and.to.be.empty();
    });
    test('time limited element is not grouped if source does not match', async () => {
      const baseElement = createChargeElement({
        purposeTertiary: 400,
        source: 'unsupported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10
      });
      const subElement = createChargeElement({
        purposeTertiary: 400,
        source: 'supported',
        season: CHARGE_SEASON.summer,
        abstractionPeriodStartDay: 1,
        abstractionPeriodStartMonth: 4,
        abstractionPeriodEndDay: 31,
        abstractionPeriodEndMonth: 10,
        startDate: '2018-04-01',
        timeLimitedStartDate: '2015-04-01',
        timeLimitedEndDate: '2020-03-31'
      });
      const reshufflingGroups = sortElementsIntoGroupsForReallocation([baseElement, subElement]);

      expect(reshufflingGroups[0].baseElement).to.equal(baseElement);
      expect(reshufflingGroups[0].subElements).to.be.an.array().and.to.be.empty();
    });
  });
  experiment('.checkQuantitiesInElementGroups', async () => {
    experiment('when there are no sub elements', async () => {
      test('it returns the base element as is', async () => {
        const baseElementGroup = [{
          baseElement: createChargeElement({
            chargeElementId: 'base-charge-element',
            proRataAuthorisedQuantity: 75,
            actualReturnQuantity: 65.3,
            maxPossibleReturnQuantity: 65.3
          }),
          subElements: []
        }];

        const { error, data } = checkQuantitiesInElementGroups(baseElementGroup);
        const inputBaseElement = baseElementGroup[0].baseElement;
        const outputBaseElement = data[0].data;

        expect(error).to.be.null();
        expect(data).to.be.an.array().and.have.length(1);
        expect(outputBaseElement.proRataAuthorisedQuantity).to.equal(inputBaseElement.proRataAuthorisedQuantity);
        expect(outputBaseElement.actualReturnQuantity).to.equal(inputBaseElement.actualReturnQuantity);
      });
      test('if the element is over abstracted, it returns an over abstraction error, but element remains the same', async () => {
        const baseElementGroup = [{
          baseElement: createChargeElement({
            chargeElementId: 'base-charge-element',
            proRataAuthorisedQuantity: 75,
            actualReturnQuantity: 80,
            maxPossibleReturnQuantity: 80
          }),
          subElements: []
        }];

        const { error, data } = checkQuantitiesInElementGroups(baseElementGroup);
        const inputBaseElement = baseElementGroup[0].baseElement;
        const outputBaseElement = data[0].data;

        expect(error).to.equal(ERROR_OVER_ABSTRACTION);
        expect(data).to.be.an.array().and.have.length(1);
        expect(outputBaseElement.proRataAuthorisedQuantity).to.equal(inputBaseElement.proRataAuthorisedQuantity);
        expect(outputBaseElement.actualReturnQuantity).to.equal(inputBaseElement.actualReturnQuantity);
      });
    });
  });
  experiment('.reshuffleQuantities', async () => {
    test('quantities for charge elements with 2 different purposes are allocated appropriately', async () => {
      const purpose400ChargeElements = [
        createChargeElement({
          chargeElementId: 'charge-element-1',
          source: 'unsupported',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 4,
          abstractionPeriodEndDay: 31,
          abstractionPeriodEndMonth: 10,
          startDate: '2018-01-01',
          timeLimitedStartDate: '2018-01-01',
          timeLimitedEndDate: '2018-12-31',
          actualReturnQuantity: 75,
          proRataAuthorisedQuantity: 100,
          maxPossibleReturnQuantity: 100,
          purposeTertiary: 400
        }),
        createChargeElement({
          chargeElementId: 'charge-element-2',
          source: 'unsupported',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 4,
          abstractionPeriodEndDay: 31,
          abstractionPeriodEndMonth: 10,
          actualReturnQuantity: 100,
          proRataAuthorisedQuantity: 100,
          maxPossibleReturnQuantity: 100,
          purposeTertiary: 400
        })
      ];
      const purpose420ChargeElements = [
        createChargeElement({
          chargeElementId: 'charge-element-3',
          source: 'supported',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 4,
          abstractionPeriodEndDay: 31,
          abstractionPeriodEndMonth: 10,
          timeLimitedStartDate: '2018-01-01',
          timeLimitedEndDate: '2018-12-31',
          startDate: '2018-01-01',
          actualReturnQuantity: 50,
          proRataAuthorisedQuantity: 50,
          maxPossibleReturnQuantity: 100,
          purposeTertiary: 420
        }),
        createChargeElement({
          chargeElementId: 'charge-element-4',
          source: 'supported',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 4,
          abstractionPeriodEndDay: 31,
          abstractionPeriodEndMonth: 10,
          actualReturnQuantity: 80,
          proRataAuthorisedQuantity: 100,
          maxPossibleReturnQuantity: 100,
          purposeTertiary: 420
        })
      ];
      const { error, data: reshuffledElements } = reshuffleQuantities([...purpose400ChargeElements, ...purpose420ChargeElements]);

      expect(error).to.be.null();
      expect(reshuffledElements[0].data.chargeElementId).to.equal('charge-element-2');
      expect(reshuffledElements[0].data.actualReturnQuantity).to.equal(100);
      expect(reshuffledElements[0].data.proRataAuthorisedQuantity).to.equal(100);
      expect(reshuffledElements[0].error).to.be.null();
      expect(reshuffledElements[1].data.chargeElementId).to.equal('charge-element-1');
      expect(reshuffledElements[1].data.actualReturnQuantity).to.equal(75);
      expect(reshuffledElements[1].data.proRataAuthorisedQuantity).to.equal(100);
      expect(reshuffledElements[1].error).to.be.null();
      expect(reshuffledElements[2].data.chargeElementId).to.equal('charge-element-4');
      expect(reshuffledElements[2].data.actualReturnQuantity).to.equal(100);
      expect(reshuffledElements[2].data.proRataAuthorisedQuantity).to.equal(100);
      expect(reshuffledElements[2].error).to.be.null();
      expect(reshuffledElements[3].data.chargeElementId).to.equal('charge-element-3');
      expect(reshuffledElements[3].data.actualReturnQuantity).to.equal(30);
      expect(reshuffledElements[3].data.proRataAuthorisedQuantity).to.equal(50);
      expect(reshuffledElements[3].error).to.be.null();
    });
  });
});
