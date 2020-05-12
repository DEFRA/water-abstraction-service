'use strict';

const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  before,
  after
} = exports.lab = require('@hapi/lab').script();

const services = require('../services');

experiment('integration-tests/billing/index', () => {
  let data;

  before(async () => {
    data = await services.scenarios.runScenario({
      licence: 'l1',
      chargeVersions: [{
        company: 'co1',
        chargeVersion: 'cv1',
        chargeElements: ['ce1']
      }]
    }, 'annual');
  });

  // @TODO - add tests
  test('bill run resolves to "ready" status', async () => {
    expect(data.status).to.equal('ready');
  });

  after(async () => {
    await services.tearDown.tearDown();
  });
});
