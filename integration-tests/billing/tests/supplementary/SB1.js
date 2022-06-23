'use strict'

const { expect } = require('@hapi/code')
const { omit } = require('lodash')

const {
  experiment,
  test,
  before,
  beforeEach,
  after
} = exports.lab = require('@hapi/lab').script()

const services = require('../../services')
// const chargeModuleTransactionsService = require('../../services/charge-module-transactions');
// const transactionTests = require('../transaction-tests');
const { createSetLoader } = require('../../services/loader')

experiment('supplementary ref: SB1', () => {
  let annualBatch
  let supplementaryBatch
  // let supplementaryChargeModuleTransactions;

  before(async () => {
    await services.tearDown.tearDown()

    // Load fixtures
    const loader = createSetLoader()
    await loader.load('crmV2', 'crm-v2.yaml')
    await loader.load('water', 'SB1-1.yaml')

    const region = loader.getRef('$region')

    // Run annual batch
    annualBatch = await services.scenarios.runScenario(region.regionId, 'annual')

    // mark the annual batch as sent so a new batch for the same
    // region can be created
    await services.batches.updateStatus(annualBatch, 'sent')

    // mark the existing charge version as superseded so the new
    // charge version is the current one.
    await services.chargeVersions.update({ status: 'superseded' })

    // Load Bookshelf fixtures for supplementary batch
    await loader.load('water', 'SB1-2.yaml')

    // Run supplementary batch
    supplementaryBatch = await services.scenarios.runScenario(region.regionId, 'supplementary')
    // supplementaryChargeModuleTransactions = await chargeModuleTransactionsService.getTransactionsForBatch(supplementaryBatch);
  })

  experiment('has expected batch details', () => {
    test('the batch is "supplementary"', async () => {
      expect(supplementaryBatch.batchType).to.equal('supplementary')
    })

    test('the batch has the correct financial year range', async () => {
      expect(supplementaryBatch.fromFinancialYearEnding).to.equal(2019)
      expect(supplementaryBatch.toFinancialYearEnding).to.equal(2020)
    })

    test('the batch is in "ready" status', async () => {
      expect(supplementaryBatch.status).to.equal('ready')
    })

    test('the batch has been created in the charge module', async () => {
      expect(supplementaryBatch.billRunNumber).to.be.a.number()
      expect(supplementaryBatch.externalId).to.be.a.string().length(36)
    })

    test('no error codes are generated', async () => {
      expect(supplementaryBatch.errorCode).to.equal(null)
    })
  })

  /*
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
   */

  experiment('has expected invoice details', () => {
    test('1 invoice is generated', async () => {
      expect(supplementaryBatch.billingInvoices.length).to.equal(1)
    })

    experiment('the first invoice', () => {
      let invoice

      beforeEach(async () => {
        invoice = supplementaryBatch.billingInvoices[0]
      })

      test('has the correct invoice account', async () => {
        expect(invoice.invoiceAccountNumber).to.equal('A99999999A')
      })

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
        })
      })

      test('has 1 licence on the invoice', async () => {
        expect(invoice.billingInvoiceLicences).to.have.length(1)
      })

      experiment('the first invoice licence', () => {
        let licence

        beforeEach(async () => {
          licence = invoice.billingInvoiceLicences[0]
        })

        test('has 2 transactions', async () => {
          expect(licence.billingTransactions.length).to.equal(4)
        })

        test('there is a debit', async () => {
          const transaction = licence.billingTransactions.find(tx => tx.isCredit === false)
          expect(transaction).to.exist()
        })

        test('there is a credit', async () => {
          const transaction = licence.billingTransactions.find(tx => tx.isCredit === true)
          expect(transaction).to.exist()
        })

        experiment('the debit transaction', () => {
          let transaction
          beforeEach(async () => {
            transaction = licence.billingTransactions.find((tx) => tx.chargeType === 'standard' && tx.isCredit === false)
          })

          test('is a standard charge', async () => {
            expect(transaction.chargeType).to.equal('standard')
            expect(transaction.isCredit).to.be.false()
            expect(transaction.isTwoPartSecondPartCharge).to.be.false()
          })

          test('has the correct charge period', async () => {
            expect(transaction.startDate).to.equal('2019-06-01')
            expect(transaction.endDate).to.equal('2020-01-01')
          })

          test('has the correct abstraction period', async () => {
            expect(transaction.abstractionPeriod).to.equal({
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 4
            })
          })

          test('has the correct factors', async () => {
            expect(transaction.source).to.equal('unsupported')
            expect(transaction.season).to.equal('all year')
            expect(transaction.loss).to.equal('low')
          })

          test('has the correct quantities', async () => {
            expect(transaction.authorisedQuantity).to.equal('50')
            expect(transaction.billableQuantity).to.equal('25')
            expect(transaction.volume).to.equal('25')
          })

          test('has the correct authorised/billable days', async () => {
            expect(transaction.authorisedDays).to.equal(366)
            expect(transaction.billableDays).to.equal(215)
          })

          test('has been sent to the charge module', async () => {
            expect(transaction.externalId).to.have.length(36)
            expect(transaction.status).to.equal('charge_created')
          })

          test('has the correct description', async () => {
            expect(transaction.description).to.equal('CE3')
          })

          test('has the correct agreements', async () => {
            expect(transaction.section126Factor).to.equal(null)
            expect(transaction.section127Agreement).to.equal(false)
            expect(transaction.section130Agreement).to.equal(null)
          })
        })

        experiment('the credit transaction', () => {
          let transaction
          beforeEach(async () => {
            transaction = licence.billingTransactions.find(tx => tx.isCredit === true && tx.chargeType === 'standard')
          })

          test('is a standard charge', async () => {
            expect(transaction.chargeType).to.equal('standard')
            expect(transaction.isCredit).to.equal(true)
            expect(transaction.isTwoPartSecondPartCharge).to.equal(false)
            expect(transaction.isDeMinimis).to.be.false()
            expect(transaction.isNewLicence).to.be.false()
          })

          test('has the correct charge period', async () => {
            expect(transaction.startDate).to.equal('2019-04-01')
            expect(transaction.endDate).to.equal('2020-03-31')
          })

          test('has the correct abstraction period', async () => {
            expect(transaction.abstractionPeriod).to.equal({
              endDay: 31,
              endMonth: 3,
              startDay: 1,
              startMonth: 4
            })
          })

          test('has the correct factors', async () => {
            expect(transaction.source).to.equal('unsupported')
            expect(transaction.season).to.equal('all year')
            expect(transaction.loss).to.equal('low')
          })

          test('has the correct quantities', async () => {
            expect(transaction.authorisedQuantity).to.equal('50')
            expect(transaction.billableQuantity).to.equal('25')
            expect(transaction.volume).to.equal('25')
          })

          test('has the correct authorised/billable days', async () => {
            expect(transaction.authorisedDays).to.equal(366)
            expect(transaction.billableDays).to.equal(366)
          })

          test('has been sent to the charge module', async () => {
            expect(transaction.externalId).to.have.length(36)
            expect(transaction.status).to.equal('charge_created')
          })

          test('has the correct description', async () => {
            expect(transaction.description).to.equal('CE3')
          })

          test('has the correct agreements', async () => {
            expect(transaction.section126Factor).to.equal(null)
            expect(transaction.section127Agreement).to.equal(false)
            expect(transaction.section130Agreement).to.equal(null)
          })
        })
      })
    })
  })

  after(async () => {
    await services.tearDown.tearDown(annualBatch, supplementaryBatch)
  })
})
