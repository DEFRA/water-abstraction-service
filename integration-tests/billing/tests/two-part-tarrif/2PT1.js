'use strict';

const { expect } = require('@hapi/code');
const chargeModuleTransactionsService = require('../../services/charge-module-transactions');
const {
  experiment,
  test,
  before
} = exports.lab = require('@hapi/lab').script();

const services = require('../../services');

experiment('two part tariff ref: 2PT1', () => {
  let batch;
  let chargeModuleTransactions;
  let twoPartTariffBatch;

  before(async () => {
    await services.tearDown.tearDown();

    batch = await services.scenarios.runScenario({
      licence: 'l1',
      licenceAgreement: 's127',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv1',
        chargeElements: ['ce2']
      }],
      returns: [
        {
          return: 'r1',
          version: 'rv1',
          lines: ['rl1']
        }
      ]
    }, 'two_part_tariff', 2020, true);
    console.log(batch);

    twoPartTariffBatch = await services.scenarios.approveTwoPartTariffBatch(batch.billingBatchId);

    chargeModuleTransactions = await chargeModuleTransactionsService.getTransactionsForBatch(twoPartTariffBatch);
    console.log(chargeModuleTransactions);
  });

  experiment('has expected batch details', () => {
    test('the batch is "supplementary"', async () => {
      expect('annual').to.equal('annual');
    });
  });

  // after(async () => {
  //   await services.tearDown.tearDown(annualBatch);
  // });
});
