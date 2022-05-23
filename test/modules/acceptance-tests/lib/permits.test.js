const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const permitsConnector = require('../../../../src/lib/connectors/permit');
const permits = require('../../../../src/modules/acceptance-tests/lib/permits');

experiment('modules/acceptance-tests/lib/permits', () => {
  beforeEach(async () => {
    sandbox.stub(permitsConnector.licences, 'create').resolves({
      data: {}
    });
    sandbox.stub(permitsConnector, 'deleteAcceptanceTestData').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.delete', () => {
    test('calls the expected function on the connector', async () => {
      await permits.delete();
      expect(permitsConnector.deleteAcceptanceTestData.called).to.be.true();
    });
  });
});
