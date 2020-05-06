const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const transactionsProcessor = require('../../../../../src/modules/billing/services/charge-processor-service/transactions-processor');

const data = require('./data');

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

        test('the first transaction is a standard charge', async () => {
          const [transaction] = transactions;
          expect(transaction.isCredit).to.be.false();
          expect(transaction.agreements).to.be.array().length(0);
          expect(transaction.status).to.equal('candidate');
          expect(transaction.chargePeriod.startDate).to.equal('2019-04-01');
          expect(transaction.chargePeriod.endDate).to.equal('2020-03-31');
          expect(transaction.authorisedDays).to.equal(366);
          expect(transaction.billableDays).to.equal(366);
          expect(transaction.volume).to.equal(8.43);
          expect(transaction.isTwoPartTariffSupplementary).to.be.false();
          expect(transaction.isCompensationCharge).to.be.false();
          expect(transaction.description).to.equal('Test Description');
        });

        test('the second transaction is a compensation charge', async () => {
          const [, transaction] = transactions;
          expect(transaction.isCredit).to.be.false();
          expect(transaction.agreements).to.be.array().length(0);
          expect(transaction.status).to.equal('candidate');
          expect(transaction.chargePeriod.startDate).to.equal('2019-04-01');
          expect(transaction.chargePeriod.endDate).to.equal('2020-03-31');
          expect(transaction.authorisedDays).to.equal(366);
          expect(transaction.billableDays).to.equal(366);
          expect(transaction.volume).to.equal(8.43);
          expect(transaction.isTwoPartTariffSupplementary).to.be.false();
          expect(transaction.isCompensationCharge).to.be.true();
          expect(transaction.description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
        });
      });
    });
  });
});
