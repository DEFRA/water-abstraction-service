'use strict'

/**
 * Bookshelf yaml fixture loader
 * Inspired by https://github.com/tomi77/node-bookshelf-fixture-loader
 */

const YAML = require('yamljs')
const path = require('path')
const { getFinancialDateRange } = require('../lib/financial-date-range')
const moment = require('moment')
const { v4: uuid } = require('uuid')

const refRegex = /^(\$[^.]+)\.([a-z0-9-_]+)$/i

/**
 * Gets a referenced value if one is available
 * @param {String} value
 * @param {Object} refs
 * @return {Mixed} value
 */
const mapValue = (value, refs) => {
  if (typeof value !== 'string') {
    return value
  }

  // Check for ref match
  const match = value.toString().match(refRegex)
  if (!match) {
    return value
  }
  return refs.get(match[1])[match[2]]
}

/**
 * Calculates the value if the input value is a reference to a calculation
 * @param {Any} value
 * @param {Integer} index
 * @return {Any | Integer | String} value
 */
const calcValue = (value, index = 0, startDate = '01-04-2022') => {
  const previousYearsDateLessIndex = moment(startDate)
    .subtract(1, 'year') // previous year
    .subtract(index, 'year') // less the index

  const previousYearsLessIndexFinancialDateRange = getFinancialDateRange(previousYearsDateLessIndex)

  const currentBillingPeriod = getFinancialDateRange(new Date())
  const previousBillingPeriod = getFinancialDateRange(new Date())
  previousBillingPeriod.startDate.subtract(1, 'year')
  previousBillingPeriod.endDate.subtract(1, 'year')

  switch (value) {
    case '$previousYearsDateLessIndex': {
      return previousYearsDateLessIndex.format('YYYY-MM-DD')
    }
    case '$previousStartDateLessIndex': {
      return previousYearsLessIndexFinancialDateRange.startDate.format('YYYY-MM-DD')
    }
    case '$previousEndDateLessIndex': {
      return previousYearsLessIndexFinancialDateRange.endDate.format('YYYY-MM-DD')
    }
    case '$previousYearLessIndex': {
      return previousYearsLessIndexFinancialDateRange.endDate.year()
    }
    case '$currentFromFinancialYearEnding': {
      return currentBillingPeriod.startDate.year()
    }
    case '$currentToFinancialYearEnding': {
      return currentBillingPeriod.endDate.year()
    }
    case '$previousFromFinancialYearEnding': {
      return previousBillingPeriod.startDate.year()
    }
    case '$previousToFinancialYearEnding': {
      return previousBillingPeriod.endDate.year()
    }
    case '$annualInvoice': return `TEST00${index}1`
    case '$2PT2Invoice': return `TEST00${index}2`
    case '$uuid': return uuid()
    case '$billRunNumber': return String(new Date().getMilliseconds()).padStart(4, '0') + index
    default:
      return value
  }
}

/**
 * Substitutes all config values within the data where the prop is found as $$[prop]
 * @param {Object} data
 * @param {Object} config
 * @return {Object} data
 */
const applyConfig = (data, config) => {
  if (config) {
    return JSON.parse(Object.entries(config).reduce((dataString, [prop, value = '']) => {
      return dataString.split(`$$[${prop}]`).join(calcValue(value, config.index, config.startFinancialYear))
    }, JSON.stringify(data)))
  } else {
    return data
  }
}

class FixtureLoader {
  /**
   * @constructor
   * @param {Object} adapter - adapter
   * @param {String} dir - path to YAML files
   * @param {Object} refs
   */
  constructor (adapter, dir, refs = null) {
    this._adapter = adapter
    this._dir = dir || __dirname

    // Tracks references
    this._refs = new Map()

    // add custom calculated data as a reference
    if (refs) {
      this.setRef(refs.name, refs.obj)
    }

    // Tracks created models
    this._models = []
  }

  /**
   * Adds additional references to the fixture loader
   * This can be used to add additional data points which are not
   * available in the DB
   *
   * @param {String} refName - the reference name, e.g. $someModel
   * @param {Object} obj - key/value pairs
   */
  setRef (refName, obj) {
    return this._refs.set(refName, obj)
  }

  /**
   * Sets initial value for refs
   * @param {Map} refs
   */
  setRefs (refs) {
    this._refs = refs
    return this
  }

  /**
   * Sets initial value for refs
   * @param {Map} refs
   */
  addRefs (refs) {
    this._refs = new Map([...this._refs, ...refs])
    return this
  }

  /**
   * Fetches all set refs
   * @return {Promise<Map>} - refs
   */
  getRefs () {
    return this._refs
  }

  /**
   * Fetches a single ref
   * @param {String} key
   */
  getRef (key) {
    return this._refs.get(key)
  }

  /**
   * Load fixtures from specified YAML file
   * @param {String} yamlFile
   * @param {Object} repeatConfig
   * @return {Promise<Array>} created Bookshelf models
   */
  async load (yamlFile, repeatConfig) {
    const file = path.resolve(this._dir, yamlFile)
    const records = applyConfig(YAML.load(file), repeatConfig)
    const { _refs } = this

    if (repeatConfig) {
      console.log(records)
    }

    for (const record of records) {
      // Pre-process field data to include references to previously inserted models
      // Models are processed sequentially
      const recordMappedData = {}
      for (const field in record.fields) {
        recordMappedData[field] = mapValue(record.fields[field], _refs)
      }

      // Create new model using adapter
      const model = await this._adapter.create(record, recordMappedData)

      // Store in refs
      if (record.ref) {
        this.setRef(record.ref, model)
      }

      this._models.push(model)
    }
  }
}

module.exports = FixtureLoader
