const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { createChargeElement } = require('../../test-data/test-charge-element-data');
const {
  getTptChargeElements,
  prepareChargeElementData,
  sortChargeElementsForMatching
} = require('../../../../../src/modules/billing/services/two-part-tariff-service/prepare-charge-elements');

experiment('modules/charging/lib/prepare-charge-elements', async () => {
  experiment('.getTptChargeElements', async () => {
    const chargeElementOptions = {
      actualReturnQuantity: 0,
      abstractionPeriodStartDay: '1',
      abstractionPeriodStartMonth: '4',
      abstractionPeriodEndDay: '31',
      abstractionPeriodEndMonth: '10',
      startDate: '2016-04-01',
      endDate: '2016-10-31',
      billableAnnualQuantity: 5.9996,
      authorisedAnnualQuantity: 5.9996,
      totalDays: 214,
      billableDays: 214,
      effectiveEndDate: '2016-10-31',
      effectiveStartDate: '2016-04-01'
    };
    test('only returns charge elements with TPT purposes', async () => {
      const chargeElementsWithTPTPurposes = [
        createChargeElement({ purposeTertiary: 380, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 410, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 420, ...chargeElementOptions })
      ];
      const chargeElementsWithOtherPurposes = [
        createChargeElement({ purposeTertiary: 200, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 180, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 620, ...chargeElementOptions })
      ];
      const chargeElements = [
        ...chargeElementsWithTPTPurposes,
        ...chargeElementsWithOtherPurposes
      ];
      const filteredElements = getTptChargeElements(chargeElements);
      expect(filteredElements).to.equal(chargeElementsWithTPTPurposes);
    });
    test('returns empty array if no TPT charge elements present', async () => {
      const nonTPTChargeElements = [
        createChargeElement({ purposeTertiary: 200, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 180, ...chargeElementOptions }),
        createChargeElement({ purposeTertiary: 620, ...chargeElementOptions })
      ];

      const filteredElements = getTptChargeElements(nonTPTChargeElements);
      expect(filteredElements).to.be.empty().and.to.be.an.array();
    });
  });

  experiment('.prepareChargeElementData', async () => {
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

    experiment('actualReturnQuantity', async () => {
      test('is set to 0', () => {
        const [updatedChargeElement] = prepareChargeElementData([createChargeElement({
          ...chargeElementOptions,
          authorisedAnnualQuantity: '5.996'
        })]);
        expect(updatedChargeElement.actualReturnQuantity).to.equal(0);
      });
    });
  });

  experiment('.sortChargeElementsForMatching', async () => {
    test('sorts the charge elements by billableDays', async () => {
      const chargeElements = [
        createChargeElement({
          billableDays: 180
        }),
        createChargeElement({
          billableDays: 56
        }),
        createChargeElement({
          billableDays: 352
        })
      ];
      const sortedElements = sortChargeElementsForMatching(chargeElements);
      expect(sortedElements).to.be.equal([
        createChargeElement({
          billableDays: 56
        }),
        createChargeElement({
          billableDays: 180
        }),
        createChargeElement({
          billableDays: 352
        })

      ]);
    });
  });
});
