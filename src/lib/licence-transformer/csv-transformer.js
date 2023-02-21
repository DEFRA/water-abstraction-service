/**
 * Transforms NALD data into VML native format
 * @module lib/licence-transformer/nald-transformer
 */
const { uniqBy } = require('lodash')
const BaseTransformer = require('./base-transformer')
const LicenceTitleLoader = require('./licence-title-loader')
const licenceTitleLoader = new LicenceTitleLoader()
const { logger } = require('../../logger')

const nald = require('@envage/water-abstraction-helpers').nald

class CSVTransformer extends BaseTransformer {
  /**
   * Load data into the transformer
   * @param {Object} data - data loaded from NALD
   */
  async load (data) {
    data = nald.transformNull(data)

    this.data = {
      licenceNumber: data.id,
      licenceHolderTitle: data.salutation,
      licenceHolderInitials: data.initials,
      licenceHolderName: data.name,
      effectiveDate: data.effectiveFrom,
      expiryDate: data.effectiveTo === 'No expiry' ? null : data.effectiveTo,
      conditions: await this.conditionFormatter(data.purposes),
      points: this.pointsFormatter(data.purposes),
      purposes: this.purposesFormatter(data.purposes),
      uniquePurposeNames: this.uniquePurposeNamesFormatter(data.purposes),
      abstractionPeriods: this.periodsFormatter(data.purposes),
      contacts: this.contactsFormatter(data)
    }

    logger.info(JSON.stringify(this.data, null, 2))
  }

  /**
   * Get list of contacts
   * @param {Object} data - CSV licence data object
   * @return {Array} contacts
   */
  contactsFormatter (data) {
    const { salutation, initials, forename, name } = data
    const { addressLine1, addressLine2, addressLine3, addressLine4, town, county, postCode, country } = data

    return [{
      type: 'Licence Holder',
      contactType: data.salutation ? 'Person' : 'Organisation',
      name: [salutation, initials, forename, name].filter(x => x).join(' '),
      addressLine1,
      addressLine2,
      addressLine3,
      addressLine4,
      town,
      county,
      postcode: postCode,
      country
    }]
  }

  /**
   * Get unique list of abstraction periods
   * @param {Array} purposes
   * @return {Array}
   */
  periodsFormatter (purposes) {
    const periods = purposes.map(item => ({
      periodStart: item.periodStart,
      periodEnd: item.periodEnd
    }))
    return uniqBy(periods, item => Object.values(item).join(','))
  }

  /**
   * Get unique array of purpose names
   * @param {Array} purposes
   * @return {Array} of string names
   */
  uniquePurposeNamesFormatter (purposes) {
    const purposeNames = purposes.map(item => item.description)
    return uniqBy(purposeNames)
  }

  /**
   * Format purposes into unique array with quantities and points data
   * @param {Array} purposes
   * @return {Array} formatted purposes
   */
  purposesFormatter (purposes) {
    const formatted = purposes.map(purpose => ({
      name: purpose.description,
      points: purpose.points,
      periodStart: purpose.periodStart,
      periodEnd: purpose.periodEnd,
      annualQty: purpose.annualQuantity,
      dailyQty: purpose.dailyQuantity,
      hourlyQty: purpose.hourlyQuantity,
      instantaneousQty: purpose.instantQuantity
    }))

    // De-duplicate
    return uniqBy(formatted, item => Object.values(item).join(','))
  }

  /**
   * Get unique list of purpose names
   * @param {}
  uniquePurposeNames

  /**
   * Formats points within purposes to a unique list
   * @param {Array} purposes
   * @return {Array}
   */
  pointsFormatter (purposes) {
    let points = []

    purposes.forEach(purpose => {
      points = [...points, ...purpose.points]
    })

    // De-duplicate
    return uniqBy(points, item => Object.values(item).join(','))
  }

  /**
   * Formats conditions in the NALD data into a form that can be used
   * in the licence conditions screen
   * @param {Object} purposes - purposes array from NALD data
   * @return {Array} array of condition types / points / conditions
   */
  async conditionFormatter (purposes) {
    // Read condition titles from CSV
    const titleData = await licenceTitleLoader.load()

    /**
     * Match a condition within the condition array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @param {String} purpose - the tertiary purpose description
     * @return {Function} returns a predicate that can be used in find
     */
    const conditionMatcher = (code, subCode, purpose) => {
      return (item) => (code === item.code) && (subCode === item.subCode) && (purpose === item.purpose)
    }

    /**
     * Match a title within the display titles array
     * @param {String} code - the condition code
     * @param {String} subCode - the sub-condition code
     * @return {Function} returns a predicate that can be used in find
     */
    const titleMatcher = (code, subCode) => {
      return (item) => (code === item.code) && (subCode === item.subCode)
    }

    /**
     * Match a point within the condition points array
     * @param {Object} point
     * @return {Function} returns a predicate that can be used in find
     */
    const pointMatcher = (points) => {
      return (item) => item.points.join(',') === points.join(',')
    }

    const conditionsArr = []

    purposes.forEach((purpose) => {
      const points = purpose.points.map(nald.formatting.formatAbstractionPoint)

      purpose.conditions.forEach((condition) => {
        const { code, subCode, parameter1, parameter2, text } = condition
        const { description: purposeText } = purpose

        if (!code) {
          return
        }

        // Condition wrapper
        let cWrapper = conditionsArr.find(conditionMatcher(code, subCode, purposeText))
        if (!cWrapper) {
          const titles = titleData.find(titleMatcher(code, subCode))
          cWrapper = { ...titles, code, subCode, points: [], purpose: purposeText }
          conditionsArr.push(cWrapper)
        }

        // Points wrapper
        let pWrapper = cWrapper.points.find(pointMatcher(points))
        if (!pWrapper) {
          pWrapper = { points, conditions: [] }
          cWrapper.points.push(pWrapper)
        }

        // Add condition
        pWrapper.conditions.push({
          parameter1,
          parameter2,
          text
        })

        // De-dedupe
        // @TODO - remove duplication in original data
        pWrapper.conditions = uniqBy(pWrapper.conditions, item => Object.values(item).join(','))
      })
    })

    return conditionsArr
  }
}

module.exports = CSVTransformer
