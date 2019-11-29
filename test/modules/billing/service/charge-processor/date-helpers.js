const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const dateHelpers = require('../../../../../src/modules/billing/service/charge-processor/date-helpers');

experiment('modules/billing/service/charge-processor/date-helpers.js', () => {
  experiment('getFinancialYearRange', () => {
    test('returns an object with start and end date of the financial year given the end year', async () => {
      const result = dateHelpers.getFinancialYearRange(2020);
      expect(result).to.equal({
        startDate: '2019-04-01',
        endDate: '2020-03-31'
      });
    });
  });

  experiment('getSmallestDateRange', () => {
    experiment('when no end dates are null', () => {
      const dates = [{
        startDate: '2018-03-02',
        endDate: '2020-04-02'
      }, {
        startDate: '2017-09-12',
        endDate: '2018-09-03'
      }, {
        startDate: '2017-12-25',
        endDate: '2019-04-24'
      }];

      test('the smallest date range is returned', async () => {
        const range = dateHelpers.getSmallestDateRange(dates);
        expect(range).to.equal({
          startDate: '2018-03-02',
          endDate: '2018-09-03'
        });
      });
    });

    experiment('when an end dates are null', () => {
      const dates = [{
        startDate: '2018-03-02',
        endDate: '2020-04-02'
      }, {
        startDate: '2017-09-12',
        endDate: null
      }, {
        startDate: '2017-12-25',
        endDate: '2019-04-24'
      }];

      test('the smallest date range is returned', async () => {
        const range = dateHelpers.getSmallestDateRange(dates);
        expect(range).to.equal({
          startDate: '2018-03-02',
          endDate: '2019-04-24'
        });
      });
    });

    experiment('when all end dates are null', () => {
      const dates = [{
        startDate: '2018-03-02',
        endDate: null
      }, {
        startDate: '2017-09-12',
        endDate: null
      }, {
        startDate: '2017-12-25',
        endDate: null
      }];

      test('the smallest date range is returned', async () => {
        const range = dateHelpers.getSmallestDateRange(dates);
        expect(range).to.equal({
          startDate: '2018-03-02',
          endDate: null
        });
      });
    });
  });
});
