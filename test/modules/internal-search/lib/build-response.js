const Lab = require('@hapi/lab');
const { experiment, test, beforeEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const { buildResponse } = require('../../../../src/modules/internal-search/lib/build-response');

const data = [{
  foo: 'bar'
}];

const pagination = {
  page: 2,
  perPage: 50
};

experiment('buildResponse', () => {
  let response;

  beforeEach(async () => {
    response = {};
  });

  test('It should add results to the response', async () => {
    buildResponse(response, 'test', data);
    expect(response.test).to.equal(data);
  });
  test('It should not add results to the response if the data is empty', async () => {
    buildResponse(response, 'test', []);
    expect(response.test).to.equal(undefined);
  });

  test('It should add paginated results to the response', async () => {
    buildResponse(response, 'test', { data, pagination });
    expect(response.test).to.equal(data);
    expect(response.pagination).to.equal(pagination);
  });

  test('It should not add paginated results to the response if the data is empty', async () => {
    buildResponse(response, 'test', { data: [], pagination });
    expect(response.test).to.equal(undefined);
    expect(response.pagination).to.equal(undefined);
  });

  test('when data is not an array and key is billingAccount it should add results to the response', async () => {
    buildResponse(response, 'billingAccount', data[0]);
    expect(response.billingAccount).to.equal(data[0]);
  });
});
