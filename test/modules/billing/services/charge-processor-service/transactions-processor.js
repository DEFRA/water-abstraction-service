const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { omit } = require('lodash');

const transactionsProcessor = require('../../../../../src/modules/billing/services/charge-processor-service/transactions-processor');

const data = require('./data');

const getTransactionData = transaction =>
  omit(transaction.toJSON(), ['value', 'chargeElement']);

experiment('modules/billing/services/transactions-processor', async () => {
  const financialYear = data.createFinancialYear();

  let chargeVersion, batch, transactions, licence;

  experiment('for an annual batch', () => {
    beforeEach(async () => {
      batch = data.createBatch('annual');
    });

    experiment('for a non-expiring licence', async () => {
      beforeEach(async () => {
        licence = data.createLicence();
      });

      experiment('for a non-expiring charge version', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('both transactions relate to the same charge element', async () => {
          expect(transactions[0].chargeElement).to.equal(chargeVersion.chargeElements[0]);
          expect(transactions[1].chargeElement).to.equal(chargeVersion.chargeElements[0]);
        });

        test('the first transaction is a standard charge', async () => {
          const t = getTransactionData(transactions[0]);
          expect(t).to.equal({
            isCredit: false,
            agreements: [],
            status: 'candidate',
            chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' },
            authorisedDays: 366,
            billableDays: 366,
            volume: 8.43,
            isTwoPartTariffSupplementary: false,
            isCompensationCharge: false,
            description: 'Test Description'
          });
        });

        test('the second transaction is a compensation charge', async () => {
          const t = getTransactionData(transactions[1]);
          expect(t).to.equal({
            isCredit: false,
            agreements: [],
            status: 'candidate',
            chargePeriod: { startDate: '2019-04-01', endDate: '2020-03-31' },
            authorisedDays: 366,
            billableDays: 366,
            volume: 8.43,
            isTwoPartTariffSupplementary: false,
            isCompensationCharge: true,
            description: 'Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element'
          });
        });
      });

      experiment('for a charge version that ends within the financial year', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ endDate: '2019-12-31' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start of the financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
        });

        test('the transactions end date is the end date of the charge version', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-12-31');
          expect(transactions[1].chargePeriod.endDate).to.equal('2019-12-31');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(275);
        });
      });

      experiment('for a charge version that ends after the financial year end', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ endDate: '2025-12-31' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start of the financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
        });

        test('the transactions end date is the end date of the financial year', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
          expect(transactions[1].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(366);
        });
      });

      experiment('for a charge version that starts within the financial year', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ startDate: '2019-06-01' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start date of the charge version', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-06-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-06-01');
        });

        test('the transactions end date is the end of the financial year', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
          expect(transactions[1].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(305);
        });
      });

      experiment('for a charge version that starts and ends within the financial year', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ startDate: '2019-06-01', endDate: '2020-02-01' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start date of the charge version', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-06-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-06-01');
        });

        test('the transactions end date is the end date of the charge version', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-02-01');
          expect(transactions[1].chargePeriod.endDate).to.equal('2020-02-01');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(246);
        });
      });

      experiment('for a charge version with time-limited elements', async () => {
        experiment('when the time-limit is outside the range of the financial year', () => {
          beforeEach(async () => {
            chargeVersion = data.createChargeVersion();
            chargeVersion.licence = licence;
            chargeVersion.chargeElements = [
              data.createChargeElement({
                timeLimitedStartDate: '2000-01-01',
                timeLimitedEndDate: '2005-01-01'
              })
            ];
            transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
          });

          test('no transactions are generated', async () => {
            expect(transactions).to.be.an.array().length(0);
          });
        });

        experiment('when the time-limit covers the whole financial year', () => {
          beforeEach(async () => {
            chargeVersion = data.createChargeVersion();
            chargeVersion.licence = licence;
            chargeVersion.chargeElements = [
              data.createChargeElement({
                timeLimitedStartDate: '2000-01-01',
                timeLimitedEndDate: '2025-01-01'
              })
            ];
            transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
          });

          test('creates 2 transactions', async () => {
            expect(transactions).to.be.an.array().length(2);
          });

          test('the transactions start date is the start date of the financial year', async () => {
            expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
            expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
          });

          test('the transactions end date is the end of the financial year', async () => {
            expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
            expect(transactions[1].chargePeriod.endDate).to.equal('2020-03-31');
          });

          test('the transactions have the correct authorised/billable days', async () => {
            expect(transactions[0].authorisedDays).to.equal(366);
            expect(transactions[1].billableDays).to.equal(366);
          });
        });

        experiment('when the time-limit ends in the financial year', () => {
          beforeEach(async () => {
            chargeVersion = data.createChargeVersion();
            chargeVersion.licence = licence;
            chargeVersion.chargeElements = [
              data.createChargeElement({
                timeLimitedStartDate: '2000-01-01',
                timeLimitedEndDate: '2019-07-01'
              })
            ];
            transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
          });

          test('creates 2 transactions', async () => {
            expect(transactions).to.be.an.array().length(2);
          });

          test('the transactions start date is the start date of the financial year', async () => {
            expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
            expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
          });

          test('the transactions end date is the end of the time limit', async () => {
            expect(transactions[0].chargePeriod.endDate).to.equal('2019-07-01');
            expect(transactions[1].chargePeriod.endDate).to.equal('2019-07-01');
          });

          test('the transactions have the correct authorised/billable days', async () => {
            expect(transactions[0].authorisedDays).to.equal(366);
            expect(transactions[1].billableDays).to.equal(92);
          });
        });

        experiment('when the time-limit starts in the financial year', () => {
          beforeEach(async () => {
            chargeVersion = data.createChargeVersion();
            chargeVersion.licence = licence;
            chargeVersion.chargeElements = [
              data.createChargeElement({
                timeLimitedStartDate: '2019-07-01',
                timeLimitedEndDate: '2025-07-01'
              })
            ];
            transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
          });

          test('creates 2 transactions', async () => {
            expect(transactions).to.be.an.array().length(2);
          });

          test('the transactions start date is the start date of the time limit', async () => {
            expect(transactions[0].chargePeriod.startDate).to.equal('2019-07-01');
            expect(transactions[1].chargePeriod.startDate).to.equal('2019-07-01');
          });

          test('the transactions end date is the end of the financial year', async () => {
            expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
            expect(transactions[1].chargePeriod.endDate).to.equal('2020-03-31');
          });

          test('the transactions have the correct authorised/billable days', async () => {
            expect(transactions[0].authorisedDays).to.equal(366);
            expect(transactions[1].billableDays).to.equal(275);
          });
        });

        experiment('when the time-limit starts and ends in the financial year', () => {
          beforeEach(async () => {
            chargeVersion = data.createChargeVersion();
            chargeVersion.licence = licence;
            chargeVersion.chargeElements = [
              data.createChargeElement({
                timeLimitedStartDate: '2019-07-01',
                timeLimitedEndDate: '2020-02-01'
              })
            ];
            transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
          });

          test('creates 2 transactions', async () => {
            expect(transactions).to.be.an.array().length(2);
          });

          test('the transactions start date is the start date of the time limit', async () => {
            expect(transactions[0].chargePeriod.startDate).to.equal('2019-07-01');
            expect(transactions[1].chargePeriod.startDate).to.equal('2019-07-01');
          });

          test('the transactions end date is the end of the time limit', async () => {
            expect(transactions[0].chargePeriod.endDate).to.equal('2020-02-01');
            expect(transactions[1].chargePeriod.endDate).to.equal('2020-02-01');
          });

          test('the transactions have the correct authorised/billable days', async () => {
            expect(transactions[0].authorisedDays).to.equal(366);
            expect(transactions[1].billableDays).to.equal(216);
          });
        });
      });
    });

    experiment('for a licence that ends within the financial year', async () => {
      beforeEach(async () => {
        licence = data.createLicence({
          expiryDate: '2019-10-01',
          revokedDate: '2019-09-01',
          lapsedDate: '2019-08-01'
        });
      });

      experiment('for a non-expiring charge version', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start date of the financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
        });

        test('the transactions end date is the earliest of expiry, revoked and lapsed dates', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-08-01');
          expect(transactions[1].chargePeriod.endDate).to.equal('2019-08-01');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(123);
        });
      });

      experiment('for a charge version that ends after the licence', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ endDate: '2019-09-01' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start date of the financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
        });

        test('the transactions end date is the earliest of expiry, revoked and lapsed dates', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-08-01');
          expect(transactions[1].chargePeriod.endDate).to.equal('2019-08-01');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(123);
        });
      });

      experiment('for a charge version that ends before the licence', async () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ endDate: '2019-05-01' });
          chargeVersion.licence = licence;
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion);
        });

        test('creates 2 transactions', async () => {
          expect(transactions).to.be.an.array().length(2);
        });

        test('the transactions start date is the start date of the financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
        });

        test('the transactions end date is the end of the charge version', async () => {
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-05-01');
          expect(transactions[1].chargePeriod.endDate).to.equal('2019-05-01');
        });

        test('the transactions have the correct authorised/billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[1].billableDays).to.equal(31);
        });
      });
    });
  });
});
