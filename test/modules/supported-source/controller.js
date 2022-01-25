'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const repos = require('../../../src/lib/connectors/repos');
const ChangeReason = require('../../../src/lib/models/supported-source');

const supportedSources = [{
  supportedSourceId: '29dfbd44-fa2f-495b-89ec-7a4d4f804386',
  id: '29dfbd44-fa2f-495b-89ec-7a4d4f804386',
  name: 'Whateverdover',
  reference: 'SS.1.24 ',
  order: 1,
  region: 'Pizzashire'
}];

const controller = require('../../../src/modules/supported-sources/controller');

experiment('./src/modules/supported-sources/controller.js', () => {
  beforeEach(async () => {
    sandbox.stub(repos.supportedSources, 'findAll').resolves(supportedSources);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getSupportedSources', () => {
    let response;

    beforeEach(async () => {
      response = await controller.getSupportedSources();
    });

    test('calls change reasons repo', async () => {
      expect(repos.supportedSources.findAll.called).to.be.true();
    });

    test('returns change reasons array mapped to model', async () => {
      expect(response.data[0]).to.be.instanceOf(ChangeReason);
      expect(response.data[0].name).to.equal(supportedSources[0].name);
      expect(response.data[0].reference).to.equal(supportedSources[0].reference);
      expect(response.data[0].order).to.equal(supportedSources[0].order);
      expect(response.data[0].region).to.equal(supportedSources[0].region);
    });
  });
});
