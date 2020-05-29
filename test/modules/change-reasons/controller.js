'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const repos = require('../../../src/lib/connectors/repos');

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

    test('returns change reasons array in { data } envelope', async () => {
      expect(response.data).to.equal(changeReasons);
    });
  });
});
