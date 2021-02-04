'use strict';

const { expect } = require('@hapi/code');

const {
  experiment,
  test,
  before,
  after,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { omit } = require('lodash');

const services = require('../../services');
const chargeModuleTransactionsService = require('../../services/charge-module-transactions');
const transactionTests = require('../transaction-tests');

const bookshelfLoader = require('../../services/bookshelf-loader')();
const crmLoader = require('../../services/crm-loader')();

experiment('basic example scenario', () => {
  let batch;
  let chargeModuleTransactions;

  before(async () => {
    await services.tearDown.tearDown();

    // Load CRM fixtures
    await crmLoader.load('crm.yaml');

    // Load Bookshelf fixtures
    bookshelfLoader.setRef('$invoiceAccount', crmLoader.getRef('$invoiceAccount'));
    await bookshelfLoader.load('AB1.yaml');
    const region = bookshelfLoader.getRef('$region');

    batch = await services.scenarios.runScenario(region.regionId, 'annual');

    chargeModuleTransactions = await chargeModuleTransactionsService.getTransactionsForBatch(batch);
  });

  experiment('has expected batch details', () => {
    test('the batch is "annual"', async () => {
      expect(batch.batchType).to.equal('annual');
    });

    test('the batch has the correct financial year range', async () => {
      expect(batch.fromFinancialYearEnding).to.equal(2020);
      expect(batch.toFinancialYearEnding).to.equal(2020);
    });

    test('the batch is in "ready" status', async () => {
      expect(batch.status).to.equal('ready');
    });

    test('the batch has been created in the charge module', async () => {
      expect(batch.billRunNumber).to.be.a.number();
      expect(batch.externalId).to.be.a.string().length(36);
    });

    test('no error codes are generated', async () => {
      expect(batch.errorCode).to.equal(null);
    });
  });

  experiment('has expected invoice details', () => {
    test('1 invoice is generated', async () => {
      expect(batch.billingInvoices).to.have.length(1);
    });

    experiment('the first invoice', () => {
      let invoice;

      beforeEach(async () => {
        invoice = batch.billingInvoices[0];
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
          addressLine4: null,
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

        test('has 2 transactions', async () => {
          expect(licence.billingTransactions).to.have.length(2);
        });

        experiment('the standard charge transaction', () => {
          let transaction;
          beforeEach(async () => {
            transaction = licence.billingTransactions.find((tx) => tx.chargeType === 'standard');
          });

          test('is a standard charge', async () => {
            expect(transaction.chargeType).to.equal('standard');
            expect(transaction.isCredit).to.be.false();
            expect(transaction.isTwoPartTariffSupplementary).to.be.false();
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
              endMonth: 3,
              startDay: 1,
              startMonth: 4
            });
          });

          test('has the correct factors', async () => {
            expect(transaction.source).to.equal('unsupported');
            expect(transaction.season).to.equal('summer');
            expect(transaction.loss).to.equal('low');
          });

          test('has the correct quantities', async () => {
            expect(transaction.authorisedQuantity).to.equal('50');
            expect(transaction.billableQuantity).to.equal('50');
            expect(transaction.volume).to.equal('50');
          });

          test('has the correct authorised/billable days', async () => {
            expect(transaction.authorisedDays).to.equal(366);
            expect(transaction.billableDays).to.equal(366);
          });

          test('has been sent to the charge module', async () => {
            expect(transaction.externalId).to.have.length(36);
            expect(transaction.status).to.equal('charge_created');
          });

          test('has the correct description', async () => {
            expect(transaction.description).to.equal('CE1');
          });

          test('has the correct agreements', async () => {
            expect(transaction.section126Factor).to.equal(null);
            expect(transaction.section127Agreement).to.equal(false);
            expect(transaction.section130Agreement).to.equal(null);
          });

          test('has a stable transaction key', async () => {
            expect(transaction.transactionKey).to.equal('dc1467401acc8ff1124ac55ef6033a15');
          });
        });
      });
    });
  });

  experiment('transactions', () => {
    test('the batch and charge module have the same number of transactions', async () => {
      transactionTests.assertNumberOfTransactions(batch, chargeModuleTransactions);
    });

    test('the batch and charge module contain the same transactions', async () => {
      transactionTests.assertTransactionsAreInEachSet(batch, chargeModuleTransactions);
    });

    test('the charge module transaction contain the expected data', async () => {
      transactionTests.assertBatchTransactionDataExistsInChargeModule(batch, chargeModuleTransactions);
    });
  });

  after(async () => {
    await services.tearDown.tearDown(batch);
  });
});
