const sinon = require('sinon');
const Lab = require('lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');

const search = require('../../../src/modules/internal-search/lib/index');
const controller = require('../../../src/modules/internal-search/controller');

const getRequest = (query, page = 1) => {
  return {
    query: {
      query,
      page
    }
  };
};

const getPagination = (page) => {
  return {
    page,
    perPage: 50
  };
};

const getData = () => [{ foo: 'bar' }];

experiment('Internal search controller', () => {
  beforeEach(async () => {
    const data = getData();
    sinon.stub(search, 'searchUsers').resolves({ data, pagination: getPagination(3) });
    sinon.stub(search, 'searchReturns').resolves(data);
    sinon.stub(search, 'searchDocuments').resolves({ data, pagination: getPagination(5) });
  });

  afterEach(async () => {
    search.searchUsers.restore();
    search.searchReturns.restore();
    search.searchDocuments.restore();
  });

  test('The response should only contain user data for a user search', async () => {
    const request = getRequest('mail@example.com');
    const result = await controller.getInternalSearch(request);
    expect(Object.keys(result)).to.only.include(['users', 'pagination']);
    expect(result.pagination.page).to.equal(3);
  });

  test('The response should only contain return data if a return ID search', async () => {
    const request = getRequest('v1:3:123/456:1234:2017-11-01:2018-10-31');
    const result = await controller.getInternalSearch(request);
    expect(Object.keys(result)).to.only.include(['returns']);
  });

  test('The response should contain return and documents data for a numeric search', async () => {
    const request = getRequest('12345678');
    const result = await controller.getInternalSearch(request);
    expect(Object.keys(result)).to.only.include(['returns', 'documents', 'pagination']);
    expect(result.pagination.page).to.equal(5);
  });

  test('The response should only contain documents data for a licence number search', async () => {
    const request = getRequest('01/123');
    const result = await controller.getInternalSearch(request);
    expect(Object.keys(result)).to.only.include(['documents', 'pagination']);
    expect(result.pagination.page).to.equal(5);
  });
});
