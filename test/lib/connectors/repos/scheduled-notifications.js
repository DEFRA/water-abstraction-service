'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const repoHelpers = require('../../../../src/lib/connectors/repos/lib/helpers');
const repo = require('../../../../src/lib/connectors/repos/scheduled-notifications');
const ScheduledNotification = require('../../../../src/lib/connectors/bookshelf/ScheduledNotification');

experiment('lib/connectors/repos/scheduled-notifications', () => {
  beforeEach(async () => {
    sandbox.stub(repoHelpers, 'findOne');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findOne', () => {
    test('calls through to the helpers findOne function', async () => {
      await repo.findOne('test-id');

      const [model, idKey, id] = repoHelpers.findOne.lastCall.args;
      expect(model).to.equal(ScheduledNotification);
      expect(idKey).to.equal('id');
      expect(id).to.equal('test-id');
    });
  });
});
