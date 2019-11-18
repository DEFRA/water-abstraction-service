const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const moment = require('moment');

const {
  isSupplementaryBatch,
  isAnnualBatch,
  isTwoPartTariffBatch,
  batchTypes,
  getFinancialYears
} = require('../../../../src/modules/billing/lib/batch');

experiment('modules/billing/lib/batch', () => {
  experiment('.isSupplementaryBatch', () => {
    test('returns true for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isSupplementaryBatch(batch)).to.be.true();
    });

    test('returns false for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isSupplementaryBatch(batch)).to.be.false();
    });

    test('returns false for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isSupplementaryBatch(batch)).to.be.false();
    });
  });

  experiment('.isAnnualBatch', () => {
    test('returns true for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isAnnualBatch(batch)).to.be.true();
    });

    test('returns false for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isAnnualBatch(batch)).to.be.false();
    });

    test('returns false for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isAnnualBatch(batch)).to.be.false();
    });
  });

  experiment('.isTwoPartTariffBatch', () => {
    test('returns false for an annual batch', async () => {
      const batch = { batch_type: batchTypes.annual };
      expect(isTwoPartTariffBatch(batch)).to.be.false();
    });

    test('returns false for a supplementary batch', async () => {
      const batch = { batch_type: batchTypes.supplementary };
      expect(isTwoPartTariffBatch(batch)).to.be.false();
    });

    test('returns true for a two part tariff batch', async () => {
      const batch = { batch_type: batchTypes.twoPartTariff };
      expect(isTwoPartTariffBatch(batch)).to.be.true();
    });
  });

  experiment('.getFinancialYears', () => {
    test('returns the expected start and end date for a single year', async () => {
      const batch = {
        start_financial_year: 2019,
        end_financial_year: 2019
      };

      const financialYears = getFinancialYears(batch);
      expect(financialYears).to.have.length(1);
      expect(financialYears[0].start).to.equal(moment('2019-04-01', 'YYYY-MM-DD'));
      expect(financialYears[0].end).to.equal(moment('2020-03-31', 'YYYY-MM-DD'));
    });
  });

  test('returns the expected start and end date for a single year', async () => {
    const batch = {
      start_financial_year: 2019,
      end_financial_year: 2021
    };

    const financialYears = getFinancialYears(batch);
    expect(financialYears).to.have.length(3);

    // 2019
    expect(financialYears[0].start).to.equal(moment('2019-04-01', 'YYYY-MM-DD'));
    expect(financialYears[0].end).to.equal(moment('2020-03-31', 'YYYY-MM-DD'));

    // 2020
    expect(financialYears[1].start).to.equal(moment('2020-04-01', 'YYYY-MM-DD'));
    expect(financialYears[1].end).to.equal(moment('2021-03-31', 'YYYY-MM-DD'));

    // 2021
    expect(financialYears[2].start).to.equal(moment('2021-04-01', 'YYYY-MM-DD'));
    expect(financialYears[2].end).to.equal(moment('2022-03-31', 'YYYY-MM-DD'));
  });
});
