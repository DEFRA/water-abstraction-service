const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const moment = require('moment');

const FinancialYear = require('../../../../src/modules/billing/lib/financial-year');

experiment('modules/billing/lib/financial-year', () => {
  test('.startYear is the year before the year ending value', async () => {
    const financialYear = new FinancialYear(2019);
    expect(financialYear.startYear).to.equal(2018);
  });

  test('.endYear is the year ending value', async () => {
    const financialYear = new FinancialYear(2019);
    expect(financialYear.endYear).to.equal(2019);
  });

  test('.start is the date the financial year started', async () => {
    const financialYear = new FinancialYear(2019);
    expect(financialYear.start).to.equal(moment('2018-04-01'));
  });

  test('.end is the date the financial year ended', async () => {
    const financialYear = new FinancialYear(2019);
    expect(financialYear.end).to.equal(moment('2019-03-31'));
  });

  experiment('.getFinancialYears', () => {
    test('returns the expected start and end date for a single year', async () => {
      const financialYears = FinancialYear.getFinancialYears(2019, 2019);
      expect(financialYears).to.have.length(1);
      expect(financialYears[0].startYear).to.equal(2018);
      expect(financialYears[0].endYear).to.equal(2019);
      expect(financialYears[0].start).to.equal(moment('2018-04-01'));
      expect(financialYears[0].end).to.equal(moment('2019-03-31'));
    });

    test('returns the expected start and end date for a multiple years', async () => {
      const financialYears = FinancialYear.getFinancialYears(2020, 2022);
      expect(financialYears).to.have.length(3);

      expect(financialYears[0].startYear).to.equal(2019);
      expect(financialYears[0].endYear).to.equal(2020);
      expect(financialYears[0].start).to.equal(moment('2019-04-01'));
      expect(financialYears[0].end).to.equal(moment('2020-03-31'));

      expect(financialYears[1].startYear).to.equal(2020);
      expect(financialYears[1].endYear).to.equal(2021);
      expect(financialYears[1].start).to.equal(moment('2020-04-01'));
      expect(financialYears[1].end).to.equal(moment('2021-03-31'));

      expect(financialYears[2].startYear).to.equal(2021);
      expect(financialYears[2].endYear).to.equal(2022);
      expect(financialYears[2].start).to.equal(moment('2021-04-01'));
      expect(financialYears[2].end).to.equal(moment('2022-03-31'));
    });
  });
});
