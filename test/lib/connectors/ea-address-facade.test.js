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

const eaAddressFacadeApi = require('../../../src/lib/connectors/ea-address-facade.js');

experiment('lib/connectors/ea-address-facade-api', () => {
  const apiResponse = { items: [] };

  beforeEach(async () => {
    sandbox.stub(config.eaAddressFacade, 'uri').value('http://test-host');
    sandbox.stub(http, 'request').resolves(apiResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getAddressesByPostcode', () => {
    let result;

    beforeEach(async () => {
      result = await eaAddressFacadeApi.getAddressesByPostcode('TT1 1TT');
    });

    test('is a GET call', async () => {
      const [{ method }] = http.request.lastCall.args;
      expect(method).to.equal('GET');
    });

    test('calls the correct endpoint', async () => {
      const [{ uri }] = http.request.lastCall.args;
      expect(uri).to.equal('http://test-host/address-service/v1/addresses/postcode');
    });

    test('sets the correct query params', async () => {
      const [{ qs }] = http.request.lastCall.args;
      expect(qs['query-string']).to.equal('TT1 1TT');
      expect(qs.key).to.equal('client1');
    });

    test('expects a JSON response', async () => {
      const [{ json }] = http.request.lastCall.args;
      expect(json).to.be.true();
    });

    test('resolves with the API response', async () => {
      expect(result).to.equal(apiResponse);
    });
  });
});
