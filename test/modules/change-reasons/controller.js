'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const repos = require('../../../src/lib/connectors/repos');
const ChangeReason = require('../../../src/lib/models/change-reason');

const changeReasons = [{
  changeReasonId: '156e4ef4-c975-4ccb-8286-3c2f82a6c9dc',
  description: 'New licence holder'
}];

const controller = require('../../../src/modules/change-reasons/controller');

experiment('./src/modules/change-reasons/controller.js', () => {
  beforeEach(async () => {
    sandbox.stub(repos.changeReasons, 'find').resolves(changeReasons);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getChangeReasons', () => {
    let response;

    beforeEach(async () => {
      response = await controller.getChangeReasons();
    });

    test('calls change reasons repo', async () => {
      expect(repos.changeReasons.find.called).to.be.true();
    });

    test('returns change reasons array mapped to model', async () => {
      expect(response.data[0]).to.be.instanceOf(ChangeReason);
      expect(response.data[0].id).to.equal(changeReasons[0].changeReasonId);
      expect(response.data[0].description).to.equal(changeReasons[0].description);
    });
  });
});
