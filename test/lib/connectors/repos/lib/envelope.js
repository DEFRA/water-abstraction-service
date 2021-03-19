'use strict';

const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const paginationHelper = require('../../../../../src/lib/connectors/repos/lib/envelope');

experiment('lib/connectors/repos/lib/envelope', () => {
  experiment('.paginateRawQueryResults', () => {
    const testData = [
      { id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 },
      { id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 },
      { id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 }];

    experiment('data', () => {
      test('includes the expected data for first page', () => {
        const { data } = paginationHelper.paginateRawQueryResults(testData, 1, 5);
        expect(data).to.equal([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]);
      });

      test('includes the expected data for second page', () => {
        const { data } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(data).to.equal([{ id: 6 }, { id: 7 }, { id: 8 }, { id: 9 }, { id: 10 }]);
      });

      test('includes the expected data for third page', () => {
        const { data } = paginationHelper.paginateRawQueryResults(testData, 3, 5);
        expect(data).to.equal([{ id: 11 }, { id: 12 }, { id: 13 }, { id: 14 }, { id: 15 }]);
      });
    });

    experiment('pagination', () => {
      test('includes the pagination', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(pagination).to.equal({
          page: 2,
          perPage: 5,
          totalRows: 15,
          pageCount: 3
        });
      });

      test('has correct page', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(pagination.page).to.equal(2);
      });

      test('has correct perPage', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(pagination.perPage).to.equal(5);
      });

      test('has correct totalRows', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(pagination.totalRows).to.equal(15);
      });

      test('has correct pageCount', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 5);
        expect(pagination.pageCount).to.equal(3);
      });

      test('has correct pageCount when not divided evenly', () => {
        const { pagination } = paginationHelper.paginateRawQueryResults(testData, 2, 4);
        expect(pagination.pageCount).to.equal(4);
      });
    });
  });
});
