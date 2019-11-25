const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { getChargeElement, wrapElementsInVersion } = require('./test-charge-data');
const Decimal = require('decimal.js-light');
Decimal.set({
  precision: 8
});
const {
  getTPTChargeElements,
  prepareChargeElementData,
  getEffectiveDates,
  sortChargeElementsForMatching
} = require('../../../../src/modules/charging/lib/prepare-charge-elements');

experiment('modules/charging/lib/prepare-charge-elements', async () => {
  experiment('.getTPTChargeElements', async () => {
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
      const filteredElements = getTPTChargeElements(chargeVersion.chargeElements);
      expect(filteredElements).to.equal(chargeElementsWithTPTPurposes);
    });
    test('returns empty array if no TPT charge elements present', async () => {
      const nonTPTChargeElements = [
        getChargeElement({ purposeTertiary: 200, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 180, ...chargeElementOptions }),
        getChargeElement({ purposeTertiary: 620, ...chargeElementOptions })
      ];
      const chargeVersion = wrapElementsInVersion(nonTPTChargeElements, '2019-04-01', '2019-08-31');
      const filteredElements = getTPTChargeElements(chargeVersion.chargeElements);
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
        const [updatedChargeElement] = prepareChargeElementData([getChargeElement({
          ...chargeElementOptions,
          authorisedAnnualQuantity: '5.996'
        })]);
        expect(updatedChargeElement.actualReturnQuantity).to.equal(0);
      });
    });
  });

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

  experiment('.sortChargeElementsForMatching', async () => {
    test('sorts the charge elements by billableDays', async () => {
      const chargeElements = [
        getChargeElement({
          billableDays: 180
        }),
        getChargeElement({
          billableDays: 56
        }),
        getChargeElement({
          billableDays: 352
        })
      ];
      const sortedElements = sortChargeElementsForMatching(chargeElements);
      expect(sortedElements).to.be.equal([
        getChargeElement({
          billableDays: 56
        }),
        getChargeElement({
          billableDays: 180
        }),
        getChargeElement({
          billableDays: 352
        })

      ]);
    });
  });
});
