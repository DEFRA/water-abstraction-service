const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const transactionsProcessor = require('../../../../../src/modules/billing/services/charge-processor-service/transactions-processor');
const data = require('./data');

experiment('modules/billing/services/charge-processor-service/transactions-processor', async () => {
  experiment('.createTransactions', async () => {
    const financialYear = data.createFinancialYear();
    let chargeVersion, batch, transactions;

    experiment('for an annual batch', () => {
      beforeEach(async () => {
        batch = data.createBatch('annual');
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
        transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
      });

      test('4 transactions are created', async () => {
        expect(transactions.length).to.equal(4);
      });

      test('a standard charge transaction is created for the first element', async () => {
        expect(transactions[0].chargeElement.purposeUse.code).to.equal('300');
        expect(transactions[0].isCompensationCharge).to.equal(false);
        expect(transactions[0].agreements).to.equal([]);
        expect(transactions[0].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[0].description).to.equal('Test Description');
      });

      test('a compensation charge transaction is created for the first element', async () => {
        expect(transactions[0].chargeElement.purposeUse.code).to.equal('300');
        expect(transactions[1].isCompensationCharge).to.equal(true);
        expect(transactions[1].agreements).to.equal([]);
        expect(transactions[1].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[1].description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });

      test('a first-part two-part tariff charge is created for the second element', async () => {
        expect(transactions[2].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[2].isCompensationCharge).to.equal(false);
        expect(transactions[2].agreements[0].code).to.equal('S127');
        expect(transactions[2].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[2].description).to.equal('First Part Spray Irrigation Direct Charge at Test Description');
      });

      test('a first-part two-part tariff compensation charge is created for the second element', async () => {
        expect(transactions[3].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[3].isCompensationCharge).to.equal(true);
        expect(transactions[3].agreements[0].code).to.equal('S127');
        expect(transactions[3].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[3].description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });
    });

    experiment('for a supplementary batch', () => {
      beforeEach(async () => {
        batch = data.createBatch('supplementary');
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
        transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
      });

      test('5 transactions are created', async () => {
        expect(transactions.length).to.equal(5);
      });

      test('a standard charge transaction is created for the first element', async () => {
        expect(transactions[0].chargeElement.purposeUse.code).to.equal('300');
        expect(transactions[0].isCompensationCharge).to.equal(false);
        expect(transactions[0].agreements).to.equal([]);
        expect(transactions[0].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[0].description).to.equal('Test Description');
      });

      test('a compensation charge transaction is created for the first element', async () => {
        expect(transactions[0].chargeElement.purposeUse.code).to.equal('300');
        expect(transactions[1].isCompensationCharge).to.equal(true);
        expect(transactions[1].agreements).to.equal([]);
        expect(transactions[1].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[1].description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });

      test('a first-part two-part tariff charge is created for the second element', async () => {
        expect(transactions[2].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[2].isCompensationCharge).to.equal(false);
        expect(transactions[2].agreements[0].code).to.equal('S127');
        expect(transactions[2].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[2].description).to.equal('First Part Spray Irrigation Direct Charge at Test Description');
      });

      test('a first-part two-part tariff compensation charge is created for the second element', async () => {
        expect(transactions[3].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[3].isCompensationCharge).to.equal(true);
        expect(transactions[3].agreements[0].code).to.equal('S127');
        expect(transactions[3].isTwoPartTariffSupplementary).to.equal(false);
        expect(transactions[3].description).to.equal('Compensation Charge calculated from all factors except Standard Unit Charge and Source (replaced by factors below) and excluding S127 Charge Element');
      });

      test('a second-part two-part tariff charge is created for the second element', async () => {
        expect(transactions[4].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[4].isCompensationCharge).to.equal(false);
        expect(transactions[4].agreements[0].code).to.equal('S127');
        expect(transactions[4].isTwoPartTariffSupplementary).to.equal(true);
        expect(transactions[4].description).to.equal('Second Part Spray Irrigation Direct Charge at Test Description');
      });
    });

    experiment('for a two-part tariff summer batch', () => {
      beforeEach(async () => {
        batch = data.createBatch('two_part_tariff', { isSummer: true });
        chargeVersion = data.createChargeVersionWithTwoPartTariff();
        const billingVolumes = chargeVersion.chargeElements
          .map(data.createBillingVolume)
          .map(billingVolume => billingVolume.fromHash({ isSummer: true }));
        transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
      });

      test('1 transaction is created', async () => {
        expect(transactions.length).to.equal(1);
      });

      test('a second-part two-part tariff charge is created for the second element', async () => {
        expect(transactions[0].chargeElement.purposeUse.code).to.equal('400');
        expect(transactions[0].isCompensationCharge).to.equal(false);
        expect(transactions[0].agreements[0].code).to.equal('S127');
        expect(transactions[0].isTwoPartTariffSupplementary).to.equal(true);
        expect(transactions[0].description).to.equal('Second Part Spray Irrigation Direct Charge at Test Description');
      });
    });

    experiment('transaction charge periods', () => {
      experiment('when licence, charge version, and elements span full financial year', () => {
        beforeEach(async () => {
          batch = data.createBatch('annual');
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period is the full financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(366);
        });
      });

      experiment('for a summer abstraction period', () => {
        beforeEach(async () => {
          batch = data.createBatch('annual');
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({
              abstractionPeriod: {
                startDay: 1,
                startMonth: 5,
                endDay: 30,
                endMonth: 9
              }
            })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period is the full financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(153);
          expect(transactions[0].billableDays).to.equal(153);
        });
      });

      experiment('for a winter abstraction period', () => {
        batch = data.createBatch('annual');

        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({
              abstractionPeriod: {
                startDay: 1,
                startMonth: 11,
                endDay: 1,
                endMonth: 3
              }
            })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period is the full financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(122);
          expect(transactions[0].billableDays).to.equal(122);
        });
      });

      experiment('when the licence starts part-way through the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence({
            startDate: '2019-05-01'
          });
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period starts on the licence start date', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(336);
        });
      });

      experiment('when the licence ends part-way through the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence({
            expiryDate: '2019-11-01',
            lapsedDate: '2019-09-01',
            revokedDate: '2019-10-01'
          });
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period ends on the earliest of expiry, lapsed and revoked dates', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-09-01');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(154);
        });
      });

      experiment('when the charge version starts part-way through the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ startDate: '2019-05-01' });
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period starts when the charge version starts', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(336);
        });
      });

      experiment('when the charge version ends part-way through the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion({ endDate: '2020-02-01' });
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period ends when the charge period ends', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-02-01');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(307);
        });
      });

      experiment('when a time-limited element does not apply to the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({ timeLimitedStartDate: '2015-01-01', timeLimitedEndDate: '2016-01-01' })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('no transactions are created', async () => {
          expect(transactions).to.have.length(0);
        });
      });

      experiment('when a time-limited element applies to the full financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({ timeLimitedStartDate: '2015-01-01', timeLimitedEndDate: '2025-01-01' })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period is the full financial year', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(366);
        });
      });

      experiment('when a time-limited element starts within the full financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({ timeLimitedStartDate: '2019-05-01', timeLimitedEndDate: '2025-01-01' })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period starts on the time-limited start date', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2020-03-31');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(336);
        });
      });

      experiment('when a time-limited element ends within the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({ timeLimitedStartDate: '2016-01-01', timeLimitedEndDate: '2019-06-01' })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period ends on the time-limited end date', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-06-01');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(62);
        });
      });

      experiment('when a time-limited element starts and ends within the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement({ timeLimitedStartDate: '2019-05-01', timeLimitedEndDate: '2019-06-01' })
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('the transaction charge period starts and ends on the time-limited dates', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-06-01');
        });

        test('the transaction has the correct number of billable days', async () => {
          expect(transactions[0].authorisedDays).to.equal(366);
          expect(transactions[0].billableDays).to.equal(32);
        });
      });
    });

    experiment('compensation charges', () => {
      batch = data.createBatch('annual');

      experiment('for licences that do not belong to water undertakers', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('generate 2 charges', async () => {
          expect(transactions).length(2);
        });

        test('generates a standard charge', async () => {
          expect(transactions[0].isCompensationCharge).to.equal(false);
        });

        test('generates a compensation charge', async () => {
          expect(transactions[0].isCompensationCharge).to.equal(false);
        });
      });

      experiment('for licences that belong to water undertakers', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence({ isWaterUndertaker: true });
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('generate 1 charge', async () => {
          expect(transactions).length(1);
        });

        test('generates a standard charge', async () => {
          expect(transactions[0].isCompensationCharge).to.equal(false);
        });
      });
    });

    experiment('section 130 - canal and rivers trust agreements', () => {
      batch = data.createBatch('annual');

      experiment('for licences that do not have a Section 130 agreement', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('transactions have no agreements', async () => {
          expect(transactions[0].agreements).to.equal([]);
          expect(transactions[1].agreements).to.equal([]);
        });
      });

      experiment('for licences that have a Section 130 agreement', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.licence.licenceAgreements = [
            data.createLicenceAgreement({ code: 'S130U' })
          ];
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('transactions have the agreements applied', async () => {
          expect(transactions[0].agreements).to.have.length(1);
          expect(transactions[0].agreements[0].code).to.equal('S130U');
          expect(transactions[1].agreements).to.have.length(1);
          expect(transactions[1].agreements[0].code).to.equal('S130U');
        });
      });

      experiment('when a Section 130 agreement starts within the financial year', () => {
        beforeEach(async () => {
          chargeVersion = data.createChargeVersion();
          chargeVersion.licence = data.createLicence();
          chargeVersion.licence.licenceAgreements = [
            data.createLicenceAgreement({ code: 'S130U', startDate: '2019-05-01' })
          ];
          chargeVersion.chargeElements = [
            data.createChargeElement()
          ];
          const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
          transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);
        });

        test('4 transactions are created', async () => {
          expect(transactions).length(4);
        });

        test('the first pair of transactions have no agreements', async () => {
          expect(transactions[0].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[0].chargePeriod.endDate).to.equal('2019-04-30');
          expect(transactions[0].agreements).to.equal([]);
          expect(transactions[1].chargePeriod.startDate).to.equal('2019-04-01');
          expect(transactions[1].chargePeriod.endDate).to.equal('2019-04-30');
          expect(transactions[1].agreements).to.equal([]);
        });

        test('the second pair of transactions agreements applied', async () => {
          expect(transactions[2].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[2].chargePeriod.endDate).to.equal('2020-03-31');
          expect(transactions[2].agreements).length(1);
          expect(transactions[2].agreements[0].code).to.equal('S130U');
          expect(transactions[3].chargePeriod.startDate).to.equal('2019-05-01');
          expect(transactions[3].chargePeriod.endDate).to.equal('2020-03-31');
          expect(transactions[3].agreements).length(1);
          expect(transactions[3].agreements[0].code).to.equal('S130U');
        });
      });
    });

    experiment('minimum charge flag', () => {
      beforeEach(async () => {
        batch = data.createBatch('annual');
      });

      test('is false when charge version start date is different from licence start date', async () => {
        chargeVersion = data.createChargeVersion({ triggersMinimumCharge: true });
        chargeVersion.chargeElements = [data.createChargeElement()];
        const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
        transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);

        expect(transactions[0].isMinimumCharge).to.equal(false);
      });

      test('is true when charge version start date is the same as licence start date', async () => {
        chargeVersion = data.createChargeVersion({ startDate: '2019-04-01', triggersMinimumCharge: true });
        chargeVersion.chargeElements = [data.createChargeElement()];
        const billingVolumes = chargeVersion.chargeElements.map(data.createBillingVolume);
        transactions = transactionsProcessor.createTransactions(batch, financialYear, chargeVersion, billingVolumes);

        expect(transactions[0].isMinimumCharge).to.equal(true);
      });
    });
  });
});
