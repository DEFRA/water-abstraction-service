'use strict';

const { expect } = require('@hapi/code');
// const chargeModuleTransactionsService = require('../../services/charge-module-transactions');
const {
  experiment,
  test,
  beforeEach,
  before,
  after
} = exports.lab = require('@hapi/lab').script();
const { omit } = require('lodash');

const services = require('../../services');
// const transactionTests = require('../transaction-tests');
const { createSetLoader } = require('../../services/loader');

experiment('two part tariff ref: 2PT1', () => {
  let batch;
  // let chargeModuleTransactions;
  let twoPartTariffBatch;

  before(async () => {
    await services.tearDown.tearDown();

    // Load fixtures
    const loader = createSetLoader();
    await loader.load('crmV2', 'crm-v2.yaml');
    await loader.load('water', '2PT1.yaml');
    await loader.load('returns', '2PT1-returns.yaml');

    const region = loader.getRef('$2ptTestRegion');

    batch = await services.scenarios.runScenario(region.regionId, 'two_part_tariff', 2020, true);
  });

  experiment('has expected batch details', () => {
    test('the batch is "two-part-tariff"', async () => {
      expect(batch.batchType).to.equal('two_part_tariff');
    });

    test('the batch has the correct financial year range', async () => {
      expect(batch.fromFinancialYearEnding).to.equal(2020);
      expect(batch.toFinancialYearEnding).to.equal(2020);
    });

    test('the batch is in "review" status', async () => {
      expect(batch.status).to.equal('review');
    });

    test('the batch has been created in the charge module', async () => {
      expect(batch.billRunNumber).to.be.a.number();
      expect(batch.externalId).to.be.a.string().length(36);
    });

    test('no error codes are generated', async () => {
      expect(batch.errorCode).to.equal(null);
    });
  });

  experiment('has approved 2PT batch', () => {
    before(async () => {
      twoPartTariffBatch = await services.scenarios.approveTwoPartTariffBatch(batch.billingBatchId);
      // chargeModuleTransactions = await chargeModuleTransactionsService.getTransactionsForBatch(twoPartTariffBatch);
    });

    experiment('has expected invoice details', () => {
      test('the batch is in "review" status', async () => {
        expect(twoPartTariffBatch.status).to.equal('ready');
      });

      test('1 invoice is generated', async () => {
        expect(twoPartTariffBatch.billingInvoices).to.have.length(1);
      });

      experiment('the first invoice', () => {
        let invoice;

        beforeEach(async () => {
          invoice = twoPartTariffBatch.billingInvoices[0];
        });

        test('has the correct invoice account', async () => {
          expect(invoice.invoiceAccountNumber).to.equal('A99999999A');
        });

        test('has the correct invoice address', async () => {
          expect(omit(invoice.address, ['uprn', 'isTest'])).to.equal({
            town: 'Testington',
            county: 'Testingshire',
            country: 'UK',
            postcode: 'TT1 1TT',
            addressLine1: 'Big Farm',
            addressLine2: 'Windy road',
            addressLine3: 'Buttercup meadow',
            addressLine4: 'Buttercup Village',
            source: 'nald'
          });
        });

        test('has 1 licence on the invoice', async () => {
          expect(invoice.billingInvoiceLicences).to.have.length(1);
        });

        experiment('the first invoice licence', () => {
          let licence;

          beforeEach(async () => {
            licence = invoice.billingInvoiceLicences[0];
          });

          test('has 1 transaction', async () => {
            expect(licence.billingTransactions).to.have.length(1);
          });

          experiment('the first transaction', () => {
            let transaction;
            beforeEach(async () => {
              transaction = licence.billingTransactions[0];
            });

            test('is a standard charge', async () => {
              expect(transaction.chargeType).to.equal('standard');
              expect(transaction.isCredit).to.be.false();
              expect(transaction.isTwoPartSecondPartCharge).to.be.true();
              expect(transaction.isDeMinimis).to.be.false();
              expect(transaction.isNewLicence).to.be.false();
            });

            test('has the correct charge period', async () => {
              expect(transaction.startDate).to.equal('2019-04-01');
              expect(transaction.endDate).to.equal('2020-03-31');
            });

            test('has the correct abstraction period', async () => {
              expect(transaction.abstractionPeriod).to.equal({
                endDay: 31,
                endMonth: 10,
                startDay: 1,
                startMonth: 4
              });
            });

            test('has the correct factors', async () => {
              expect(transaction.source).to.equal('unsupported');
              expect(transaction.season).to.equal('summer');
              expect(transaction.loss).to.equal('high');
            });

            test('has the correct quantities', async () => {
              expect(transaction.authorisedQuantity).to.equal('25');
              expect(transaction.billableQuantity).to.equal('25');
              expect(transaction.volume).to.equal('10');
            });

            test('has the correct authorised/billable days', async () => {
              expect(transaction.authorisedDays).to.equal(214);
              expect(transaction.billableDays).to.equal(214);
            });

            test('has been sent to the charge module', async () => {
              expect(transaction.externalId).to.have.length(36);
              expect(transaction.status).to.equal('charge_created');
            });

            test('has the correct description', async () => {
              expect(transaction.description).to.equal('Second Part Spray Irrigation - Direct Charge at CE2');
            });

            test('has the correct agreements', async () => {
              expect(transaction.section126Factor).to.equal(null);
              expect(transaction.section127Agreement).to.equal(true);
              expect(transaction.section130Agreement).to.equal(null);
            });
          });
        });
      });
    });
  });
  /*
  experiment('transactions', () => {
    test('the batch and charge module have the same number of transactions', async () => {
      transactionTests.assertNumberOfTransactions(twoPartTariffBatch, chargeModuleTransactions);
    });

    test('the batch and charge module contain the same transactions', async () => {
      transactionTests.assertTransactionsAreInEachSet(twoPartTariffBatch, chargeModuleTransactions);
    });

    test('the charge module transaction contain the expected data', async () => {
      transactionTests.assertBatchTransactionDataExistsInChargeModule(twoPartTariffBatch, chargeModuleTransactions);
    });
  });
  */

  after(async () => {
    await services.tearDown.tearDown(batch);
  });
});
