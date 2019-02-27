const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect, fail } = require('code');
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

experiment('getUserByUserName', () => {
  const userName = 'testing@example.com';

  beforeEach(async () => {
    sandbox.stub(idmConnector.usersClient, 'findMany').resolves({
      data: [{ user_id: 123 }],
      error: null
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the expected filter', async () => {
    await idmConnector.usersClient.getUserByUserName(userName);
    const [filter] = idmConnector.usersClient.findMany.lastCall.args;
    expect(filter).to.equal({ user_name: userName });
  });

  test('returns the expected data', async () => {
    idmConnector.usersClient.findMany.resolves({
      data: [{ user_id: 123 }],
      error: null
    });

    const user = await idmConnector.usersClient.getUserByUserName(userName);

    expect(user.user_id).to.equal(123);
  });

  test('returns undefined when the user is not found', async () => {
    idmConnector.usersClient.findMany.resolves({
      data: [],
      error: null
    });

    const user = await idmConnector.usersClient.getUserByUserName(userName);

    expect(user).to.be.undefined();
  });

  test('throws if an error is returned', async () => {
    idmConnector.usersClient.findMany.resolves({
      error: { name: 'User not found' },
      data: []
    });

    try {
      await idmConnector.usersClient.getUserByUserName(userName);
      fail('Should never get here');
    } catch (err) {
      expect(err).to.exist();
    }
  });
});
