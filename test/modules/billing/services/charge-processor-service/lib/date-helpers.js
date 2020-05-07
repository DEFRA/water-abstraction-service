const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const dateHelpers = require('../../../../../../src/modules/billing/services/charge-processor-service/lib/date-helpers');

const DATE_FORMAT = 'YYYY-MM-DD';

const dates = [
  '2020-01-01',
  '2019-04-05',
  null,
  '2025-05-02'
];

experiment('modules/billing/services/charge-processor-service/lib/date-helpers', async () => {
  experiment('.applyEffectiveDates', () => {
    test('replaces start/end dates with the effective dates', async () => {
      const obj = {
        foo: 'bar',
        startDate: '2019-04-01',
        endDate: '2020-03-31',
        effectiveStartDate: '2019-05-01',
        effectiveEndDate: '2019-10-31'
      };
      const result = dateHelpers.applyEffectiveDates(obj);
      expect(result).to.equal({
        foo: 'bar',
        startDate: '2019-05-01',
        endDate: '2019-10-31',
        effectiveStartDate: '2019-05-01',
        effectiveEndDate: '2019-10-31',
        originalStartDate: '2019-04-01',
        originalEndDate: '2020-03-31'
      });
    });
  });

  experiment('.getSortedDates', () => {
    test('sorts by date removing nulls', async () => {
      const result = dateHelpers.getSortedDates(dates);
      expect(result).length(3);
      expect(result[0].format(DATE_FORMAT)).to.equal('2019-04-05');
      expect(result[1].format(DATE_FORMAT)).to.equal('2020-01-01');
      expect(result[2].format(DATE_FORMAT)).to.equal('2025-05-02');
    });
  });

  experiment('.getMinDate', () => {
    test('gets earliest date removing nulls', async () => {
      const result = dateHelpers.getMinDate(dates);
      expect(result.format(DATE_FORMAT)).to.equal('2019-04-05');
    });
  });

  experiment('.getMaxDate', () => {
    test('gets earliest date removing nulls', async () => {
      const result = dateHelpers.getMaxDate(dates);
      expect(result.format(DATE_FORMAT)).to.equal('2025-05-02');
    });
  });

  experiment('.findByDate', () => {
    test('finds the object with the date range containing the specified date', async () => {
      const arr = [{
        startDate: '2019-01-01',
        endDate: '2019-03-31'
      },
      {
        startDate: '2020-01-01',
        endDate: '2020-03-31'
      },
      {
        startDate: '2021-01-01',
        endDate: '2021-03-31'
      }];

      const result = dateHelpers.findByDate(arr, '2020-02-03');
      expect(result).to.equal(arr[1]);
    });
  });
});
