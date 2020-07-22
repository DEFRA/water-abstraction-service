const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { http } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');

const companiesHouseApi = require('../../../src/lib/connectors/companies-house.js');

experiment('lib/connectors/companies-house', () => {
  const apiResponse = { items: [] };

  beforeEach(async () => {
    sandbox.stub(config.companiesHouse, 'apiKey').value('my_api_key');
    sandbox.stub(http, 'request').resolves(apiResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.searchCompanies', () => {
    let result;

    beforeEach(async () => {
      result = await companiesHouseApi.searchCompanies('Big Co Ltd', 20, 30);
    });

    test('is a GET call', async () => {
      const [{ method }] = http.request.lastCall.args;
      expect(method).to.equal('GET');
    });

    test('calls the correct endpoint', async () => {
      const [{ uri }] = http.request.lastCall.args;
      expect(uri).to.equal('https://api.companieshouse.gov.uk/search/companies');
    });

    test('sets the correct query params', async () => {
      const [{ qs }] = http.request.lastCall.args;
      expect(qs.q).to.equal('Big Co Ltd');
      expect(qs.start_index).to.equal(20);
      expect(qs.items_per_page).to.equal(30);
    });

    test('expects a JSON response', async () => {
      const [{ json }] = http.request.lastCall.args;
      expect(json).to.be.true();
    });

    test('sets a base 64 encoded auth header', async () => {
      const [{ headers }] = http.request.lastCall.args;
      expect(headers.Authorization).to.equal('Basic bXlfYXBpX2tleQ==');
    });

    test('resolves with the API response', async () => {
      expect(result).to.equal(apiResponse);
    });
  });
});
