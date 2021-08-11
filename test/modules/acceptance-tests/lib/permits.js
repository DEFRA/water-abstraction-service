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

  experiment('.createCurrentLicence', () => {
    beforeEach(async () => {
      await permits.createCurrentLicence('test-lic-ref');
    });

    test('uses the licence ref to create the permit', async () => {
      const [permit] = permitsConnector.licences.create.lastCall.args;
      expect(permit.licence_ref).to.equal('test-lic-ref');
    });

    test('includes a known source to allow the data to be deleted', async () => {
      const [permit] = permitsConnector.licences.create.lastCall.args;
      expect(JSON.parse(permit.metadata).source).to.equal('acceptance-test-setup');
    });
  });
});
