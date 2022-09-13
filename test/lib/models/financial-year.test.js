const { experiment, test } = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const moment = require('moment')

const FinancialYear = require('../../../src/lib/models/financial-year')

class TestModel {};

experiment('lib/models/financial-year', () => {
  test('.startYear is the year before the year ending value', async () => {
    const financialYear = new FinancialYear(2019)
    expect(financialYear.startYear).to.equal(2018)
  })

  test('.endYear is the year ending value', async () => {
    const financialYear = new FinancialYear(2019)
    expect(financialYear.endYear).to.equal(2019)
  })

  test('.start is the date the financial year started', async () => {
    const financialYear = new FinancialYear(2019)
    expect(financialYear.start).to.equal(moment('2018-04-01'))
  })

  test('.end is the date the financial year ended', async () => {
    const financialYear = new FinancialYear(2019)
    expect(financialYear.end).to.equal(moment('2019-03-31'))
  })

  experiment('.isEqualTo', () => {
    test('returns true if the financial year is the same as the one supplied', async () => {
      const financialYear = new FinancialYear(2019)
      const comparison = new FinancialYear(2019)
      expect(financialYear.isEqualTo(comparison)).to.equal(true)
    })

    test('returns false if the financial year is different same as the one supplied', async () => {
      const financialYear = new FinancialYear(2019)
      const comparison = new FinancialYear(2020)
      expect(financialYear.isEqualTo(comparison)).to.equal(false)
    })

    test('throws an error if the argument is not a FinancialYear instance', async () => {
      const func = () => {
        const financialYear = new FinancialYear(2019)
        return financialYear.isEqualTo(new TestModel())
      }
      expect(func).to.throw()
    })
  })
})
