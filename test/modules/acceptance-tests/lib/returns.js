const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const returnsConnector = require('../../../../src/lib/connectors/returns');
const returns = require('../../../../src/modules/acceptance-tests/lib/returns');

experiment('modules/acceptance-tests/lib/returns', () => {
  beforeEach(async () => {
    sandbox.stub(returnsConnector.returns, 'create').resolves({
      data: {}
    });
    sandbox.stub(returnsConnector, 'deleteAcceptanceTestData').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createDueReturn', () => {
    let createdReturn;

    beforeEach(async () => {
      await returns.createDueReturn('test-lic-ref', 'day');
      createdReturn = returnsConnector.returns.create.lastCall.args[0];
    });

    test('uses the licence ref to create the return', async () => {
      expect(createdReturn.licence_ref).to.equal('test-lic-ref');
    });

    test('uses the frequency to create the return', async () => {
      expect(createdReturn.returns_frequency).to.equal('day');
    });

    test('includes a known source to allow the data to be deleted', async () => {
      expect(createdReturn.source).to.equal('acceptance-test-setup');
    });
  });

  experiment('.delete', () => {
    test('calls the expected function on the connector', async () => {
      await returns.delete();
      expect(returnsConnector.deleteAcceptanceTestData.called).to.be.true();
    });
  });
});
