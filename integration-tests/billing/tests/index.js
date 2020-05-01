'use strict';

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
        chargeVersion: 'cv1',
        chargeElements: ['ce1']
      }]
    }, 'annual');
  });

  test('example test', async () => {
    // @TODO - check data here
    console.log(data);
  });

  after(async () => {
    await services.tearDown.tearDown();
  });
});
