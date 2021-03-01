const { expect } = require('@hapi/code');
const {
  beforeEach,
  experiment,
  test,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const moment = require('moment');
const chargeVersionJobProcessor =
require('../../../../src/modules/charge-versions/lib/charge-version-workflow-jobs-processor');

const licenceVersions = require('../../../../src/lib/connectors/repos/licence-versions');
const { queueManager } = require('../../../../src/lib/message-queue-v2');
const data = [
  { licenceVersionId: 'test-lv-id1', licenceId: 'test-l-id1' },
  { licenceVersionId: 'test-lv-id2', licenceId: 'test-l-id2' },
  { licenceVersionId: 'test-lv-id3', licenceId: 'test-l-id3' }
];

experiment('charge version workflow processor', () => {
  beforeEach(async () => {
    sandbox.stub(licenceVersions, 'findIdsByDateNotInChargeVersionWorkflows').returns(data);
    sandbox.stub(queueManager, 'add').returns({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('add job to queue', () => {
    beforeEach(async () => {
      await chargeVersionJobProcessor();
    });

    test('finds the licence and licence version ids created in the last 24 hours', async () => {
      expect(licenceVersions.findIdsByDateNotInChargeVersionWorkflows.callCount).to.equal(1);
      expect(licenceVersions.findIdsByDateNotInChargeVersionWorkflows.lastCall.args[0].substr(0, 12)).to.equal(moment().add(-24, 'hour').toISOString().substr(0, 12));
    });

    test('adds a job to the queue for each licence version found', async () => {
      expect(queueManager.add.callCount).to.equal(3);
      expect(queueManager.add.lastCall.args).to.equal(['new-LicenceVersion', 'test-lv-id3', 'test-l-id3']);
    });
  });
});
