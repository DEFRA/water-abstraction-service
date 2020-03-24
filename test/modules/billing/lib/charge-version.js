const moment = require('moment');
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { isValidForFinancialYear } = require('../../../../src/modules/billing/lib/charge-version');

experiment('modules/billing/lib/charge-version', () => {
  experiment('.isValidForFinancialYear', () => {
    const financialYear = { start: moment('2019-04-01'), end: moment('2020-03-31') };

    test('returns true when the start dates match and there is no end date', async () => {
      // Financial Year:      |------------|
      // Charge Version:      |-------------
      const chargeVersion = { startDate: '2019-04-01', endDate: null };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true when the start date is before the start of the financial year and there is no end date', async () => {
      // Financial Year:      |------------|
      // Charge Version:    |---------------
      const chargeVersion = { startDate: '2019-01-01', endDate: null };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true when the start date is before the start of the financial year and the end date is before the financial year end', async () => {
      // Financial Year:      |------------|
      // Charge Version:    |------------|
      const chargeVersion = { startDate: '2019-01-01', endDate: '2019-11-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true when the start and end dates match', async () => {
      // Charge Version:      |------------|
      // Financial Year:      |------------|
      const chargeVersion = { startDate: '2019-04-01', endDate: '2020-03-31' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true when the start dates match and the end date is after the end of the financial year', async () => {
      // Financial Year:      |------------|
      // Charge Version:      |--------------|
      const chargeVersion = { startDate: '2019-04-01', endDate: '2020-05-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true if the start date is before the financial year and the end date is earlier than the end date', async () => {
      // Financial Year:      |------------|
      // Charge Version:    |----------------|
      const chargeVersion = { startDate: '2019-02-01', endDate: '2020-05-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true if the start date is after the financial year start and the end date is after the financial year end', async () => {
      // Financial Year:      |------------|
      // Charge Version:        |------------|
      const chargeVersion = { startDate: '2019-06-01', endDate: '2020-06-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns true if the start date is after the financial year start and the end date is null', async () => {
      // Financial Year:      |------------|
      // Charge Version:        |-------------
      const chargeVersion = { startDate: '2019-06-01', endDate: null };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.true();
    });

    test('returns false if the start date is after the financial year end', async () => {
      // Financial Year:      |------------|
      // Charge Version:                     |-----------|
      const chargeVersion = { startDate: '2020-06-01', endDate: '2021-03-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.false();
    });

    test('returns false if the start date is after the financial year end and the end date is null', async () => {
      // Financial Year:      |------------|
      // Charge Version:                     |-----------
      const chargeVersion = { startDate: '2020-06-01', endDate: null };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.false();
    });

    test('returns false if the end date is before the financial year start', async () => {
      // Financial Year:                    |------------|
      // Charge Version:      |-----------|
      const chargeVersion = { startDate: '2018-04-01', endDate: '2019-03-01' };
      expect(isValidForFinancialYear(chargeVersion, financialYear)).to.be.false();
    });
  });
});
