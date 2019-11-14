const Lab = require('@hapi/lab');
const { experiment, test, beforeEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const { set } = require('lodash');

const { createReturnsFilter } = require('../../../../src/modules/companies/lib/returns');

experiment('createReturnsFilter', () => {
  let request;
  let documents;

  const baseFilter = {
    'metadata->>isCurrent': 'true',
    licence_ref: { $in: ['licence_1', 'licence_2'] }
  };

  beforeEach(async () => {
    documents = [{
      system_external_id: 'licence_1'
    }, {
      system_external_id: 'licence_2'
    }];
    request = {
      query: {

      }
    };
  });

  test('finds current returns for specified licences', async () => {
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal(baseFilter);
  });

  test('filters by start date if specified in the request', async () => {
    set(request, 'query.startDate', '2018-04-01');
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      start_date: {
        $gte: '2018-04-01'
      }
    });
  });

  test('filters by end date if specified in the request', async () => {
    set(request, 'query.endDate', '2019-03-31');
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      end_date: {
        $lte: '2019-03-31'
      }
    });
  });

  test('filters by summer return flag if specified in the request', async () => {
    set(request, 'query.isSummer', true);
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      'metadata->>isSummer': 'true'
    });
  });

  test('filters by status if specified in the request', async () => {
    set(request, 'query.status', 'due');
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      status: 'due'
    });
  });

  test('filters to only include digital service returns if specified in the request', async () => {
    set(request, 'query.excludeNaldReturns', true);
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      end_date: {
        $gte: '2018-10-31'
      }
    });
  });

  test('can merge multiple filter parameters on the same field', async () => {
    set(request, 'query.endDate', '2019-03-31');
    set(request, 'query.excludeNaldReturns', true);
    const result = createReturnsFilter(request, documents);
    expect(result).to.equal({
      ...baseFilter,
      end_date: {
        $lte: '2019-03-31',
        $gte: '2018-10-31'
      }
    });
  });
});
