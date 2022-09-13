const moment = require('moment')
const validators = require('./validators')

class FinancialYear {
  /**
   *
   * @param {Number} yearEnding The year the financial year ends e.g. 2019 would be the year 01/04/2018 to 31/03/2019
   */
  constructor (yearEnding) {
    validators.assertPositiveInteger(yearEnding)
    this.yearEnding = parseInt(yearEnding)
  }

  /**
   * Gets the start year of the financial year
   */
  get startYear () {
    return this.yearEnding - 1
  }

  /**
   * Gets the end year of the financial year
   */
  get endYear () {
    return this.yearEnding
  }

  /**
   * Gets the start date of the financial year e.g. 01/04/2019
   */
  get start () {
    return moment(`${this.startYear}-04-01`)
  }

  /**
   * Gets the end date of the financial year e.g. 31/03/2019
   */
  get end () {
    return moment(`${this.endYear}-03-31`)
  }

  /**
   * Checks if this financial year is equal to the one
   * supplied
   * @param {FinancialYear} financialYear
   * @return {Boolean}
   */
  isEqualTo (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear)
    return this.yearEnding === financialYear.yearEnding
  }
}

module.exports = FinancialYear
