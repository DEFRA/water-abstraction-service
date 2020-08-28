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

const services = require('../services');
const chargeModuleTransactionsService = require('../services/charge-module-transactions');
const transactionTests = require('./transaction-tests');

experiment('annual batch ref: AB2', () => {
  let batch;
  let chargeModuleTransactions;

  before(async () => {
    await services.tearDown.tearDown();

    batch = await services.scenarios.runScenario({
      licence: 'l1',
      licenceAgreement: 's127',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv1',
        chargeElements: ['ce1']
      }]
    }, 'annual');

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
        expect(invoice.address).to.equal({
          town: 'Testington',
          county: 'Testingshire',
          country: 'UK',
          postcode: 'TT1 1TT',
          addressLine1: 'Big Farm',
          addressLine2: 'Windy road',
          addressLine3: 'Buttercup meadow',
          addressLine4: null,
          uprn: null,
          source: 'wrls'
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

        test('has the correct licence name', async () => {
          expect(licence.licenceHolderName.fullName).to.equal('Mr John Testerson');
          expect(licence.licenceHolderName.lastName).to.equal('Testerson');
          expect(licence.licenceHolderName.firstName).to.equal('John');
          expect(licence.licenceHolderName.salutation).to.equal('Mr');
        });

        test('has the correct licence holder address', async () => {
          expect(omit(licence.licenceHolderAddress, 'id')).to.equal({
            town: 'Testington',
            county: 'Testingshire',
            country: 'UK',
            postcode: 'TT1 1TT',
            addressLine1: 'Big Farm',
            addressLine2: 'Windy road',
            addressLine3: 'Buttercup meadow',
            addressLine4: null
          });
        });

        test('has the correct licence agreement', async () => {
          expect(licence.licenceAgreements[0]).to.equal({
            dateRange: {
              startDate: '2008-04-01',
              endDate: null
            },
            agreement: {
              code: 'S127'
            },
            dateSigned: '2008-05-05'
          });
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
            expect(transaction.isTwoPartTariffSupplementary).to.be.false();
          });

          test('has the correct charge period', async () => {
            expect(transaction.startDate).to.equal('2019-04-01');
            expect(transaction.endDate).to.equal('2020-03-31');
          });

          test('has the correct abstraction period', async () => {
            expect(transaction.abstractionPeriod).to.equal({
              endDay: 31,
              endMonth: 12,
              startDay: 1,
              startMonth: 1
            });
          });

          test('has the correct factors', async () => {
            expect(transaction.source).to.equal('unsupported');
            expect(transaction.season).to.equal('all year');
            expect(transaction.loss).to.equal('medium');
          });

          test('has the correct quantities', async () => {
            expect(transaction.authorisedQuantity).to.equal('200');
            expect(transaction.billableQuantity).to.equal(null);
            expect(transaction.volume).to.equal('200');
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
            expect(transaction.section127Agreement).to.equal(true);
            expect(transaction.section130Agreement).to.equal(null);
          });

          test('has a stable transaction key', async () => {
            expect(transaction.transactionKey).to.equal('f9baea29940ee18a32f16c705cf65739');
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
