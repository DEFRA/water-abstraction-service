'use strict';

const { expect } = require('@hapi/code');
const { omit } = require('lodash');

const {
  experiment,
  test,
  before,
  beforeEach,
  after
} = exports.lab = require('@hapi/lab').script();

const services = require('../../services');
const chargeModuleTransactionsService = require('../../services/charge-module-transactions');
const transactionTests = require('../transaction-tests');

// Scenario: Supplementary Batch 2
// Increase to Authorised Quantity in current financial year
experiment('supplementary ref: SB2', () => {
  let annualBatch;
  let supplementaryBatch;
  let supplementaryChargeModuleTransactions;

  before(async () => {
    await services.tearDown.tearDown();
    console.log('tear down complete');

    console.log('creating annual batch');
    annualBatch = await services.scenarios.runScenario({
      licence: 'l2',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv1',
        chargeElements: ['ce1']
      }]
    }, 'annual');

    // mark the annual batch as sent so a new batch for the same
    // region can be created
    await services.batches.updateStatus(annualBatch, 'sent');

    // set the end date on the current charge version before
    // the start of the new one, so that both are used in batch
    await services.chargeVersions.update({ endDate: '2019-09-30' });

    console.log('creating supplementary batch');
    supplementaryBatch = await services.scenarios.runScenario({
      licence: 'l2',
      chargeVersions: [{
        company: 'co1',
        invoiceAccount: 'ia1',
        chargeVersion: 'cv3',
        chargeElements: ['ce3']
      }]
    }, 'supplementary');

    supplementaryChargeModuleTransactions = await chargeModuleTransactionsService.getTransactionsForBatch(supplementaryBatch);
  });

  experiment('has expected batch details', () => {
    test('the batch is "supplementary"', async () => {
      expect(supplementaryBatch.batchType).to.equal('supplementary');
    });

    test('the batch has the correct financial year range', async () => {
      expect(supplementaryBatch.fromFinancialYearEnding).to.equal(2019);
      expect(supplementaryBatch.toFinancialYearEnding).to.equal(2020);
    });

    test('the batch is in "ready" status', async () => {
      expect(supplementaryBatch.status).to.equal('ready');
    });

    test('the batch has been created in the charge module', async () => {
      expect(supplementaryBatch.billRunNumber).to.be.a.number();
      expect(supplementaryBatch.externalId).to.be.a.string().length(36);
    });

    test('no error codes are generated', async () => {
      expect(supplementaryBatch.errorCode).to.equal(null);
    });
  });

  experiment('has expected invoice details', () => {
    test('1 invoice is generated', async () => {
      expect(supplementaryBatch.billingInvoices.length).to.equal(1);
    });

    experiment('the first invoice', () => {
      let invoice;

      beforeEach(async () => {
        invoice = supplementaryBatch.billingInvoices[0];
      });

      test('has the correct invoice account', async () => {
        expect(invoice.invoiceAccountNumber).to.equal('A99999999A');
      });

      test('has the correct invoice address', async () => {
        expect(omit(invoice.address, 'uprn')).to.equal({
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

        test('has the correct licence name', async () => {
          expect(licence.licenceHolderName.lastName).to.equal('Testerson');
          expect(licence.licenceHolderName.firstName).to.equal('John');
          expect(licence.licenceHolderName.title).to.equal('Mr');
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

        test('has 3 transactions', async () => {
          expect(licence.billingTransactions.length).to.equal(3);
        });

        test('there are 2 debit', async () => {
          const transactions = licence.billingTransactions.filter(tx => tx.isCredit === false);
          expect(transactions).to.have.length(2);
        });

        test('there is a credit', async () => {
          const transaction = licence.billingTransactions.find(tx => tx.isCredit === true);
          expect(transaction).to.exist();
        });

        experiment('the first debit transaction', () => {
          let transaction;
          beforeEach(async () => {
            transaction = licence.billingTransactions.find(tx => tx.isCredit === false && tx.description === 'CE1');
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
            expect(transaction.endDate).to.equal('2019-09-30');
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
            expect(transaction.billableDays).to.equal(183);
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
            expect(transaction.transactionKey).to.equal('7e9282747c5e9493f6f3c2e7a63e4adf');
          });
        });

        experiment('the second debit transaction', () => {
          let transaction;
          beforeEach(async () => {
            transaction = licence.billingTransactions.find(tx => tx.isCredit === false && tx.description === 'CE3');
          });

          test('is a standard charge', async () => {
            expect(transaction.chargeType).to.equal('standard');
            expect(transaction.isCredit).to.be.false();
            expect(transaction.isTwoPartTariffSupplementary).to.be.false();
            expect(transaction.isDeMinimis).to.be.false();
            expect(transaction.isNewLicence).to.be.false();
          });

          test('has the correct charge period', async () => {
            expect(transaction.startDate).to.equal('2019-10-01');
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
            expect(transaction.authorisedQuantity).to.equal('300');
            expect(transaction.billableQuantity).to.equal(null);
            expect(transaction.volume).to.equal('300');
          });

          test('has the correct authorised/billable days', async () => {
            expect(transaction.authorisedDays).to.equal(366);
            expect(transaction.billableDays).to.equal(183);
          });

          test('has been sent to the charge module', async () => {
            expect(transaction.externalId).to.have.length(36);
            expect(transaction.status).to.equal('charge_created');
          });

          test('has the correct description', async () => {
            expect(transaction.description).to.equal('CE3');
          });

          test('has the correct agreements', async () => {
            expect(transaction.section126Factor).to.equal(null);
            expect(transaction.section127Agreement).to.equal(false);
            expect(transaction.section130Agreement).to.equal(null);
          });

          test('has a stable transaction key', async () => {
            expect(transaction.transactionKey).to.equal('e91a7c4dd9913a40e1e19dcc76434b62');
          });
        });

        experiment('the credit transaction', () => {
          let transaction;
          beforeEach(async () => {
            transaction = licence.billingTransactions.find(tx => tx.isCredit === true);
          });

          test('is a standard charge', async () => {
            expect(transaction.chargeType).to.equal('standard');
            expect(transaction.isCredit).to.equal(true);
            expect(transaction.isTwoPartTariffSupplementary).to.equal(false);
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
            expect(transaction.section127Agreement).to.equal(false);
            expect(transaction.section130Agreement).to.equal(null);
          });

          test('has a stable transaction key', async () => {
            expect(transaction.transactionKey).to.equal('95b35a7fcb7bc505f6ad2b62f034dade');
          });
        });
      });
    });
  });

  experiment('transactions', () => {
    test('the batch and charge module have the same number of transactions', async () => {
      transactionTests.assertNumberOfTransactions(
        supplementaryBatch,
        supplementaryChargeModuleTransactions
      );
    });

    test('the batch and charge module contain the same transactions', async () => {
      transactionTests.assertTransactionsAreInEachSet(
        supplementaryBatch,
        supplementaryChargeModuleTransactions
      );
    });

    test('the charge module transaction contain the expected data', async () => {
      transactionTests.assertBatchTransactionDataExistsInChargeModule(
        supplementaryBatch,
        supplementaryChargeModuleTransactions
      );
    });
  });

  after(async () => {
    await services.tearDown.tearDown(annualBatch, supplementaryBatch);
  });
});
