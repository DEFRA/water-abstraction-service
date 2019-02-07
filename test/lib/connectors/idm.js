const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test } = exports.lab = require('lab').script();

const idmConnector = require('../../../src/lib/connectors/idm');

experiment('getUsersByExternalId', () => {
  const externalIds = [1, 2, 3, 4];
  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findMany').resolves({
      data: [],
      error: null
    });
    await idmConnector.usersClient.getUsersByExternalId(externalIds);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the expected filter', async () => {
    const [filter] = idmConnector.usersClient.findMany.lastCall.args;
    expect(filter).to.equal({
      external_id: {
        $in: externalIds
      }
    });
  });
});
