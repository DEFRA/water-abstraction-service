const { snakeCase, camelCase, sortBy, isEqual } = require('lodash')
const csvParser = require('../csv-adapter/csv-parser')
const { csvFields } = require('./csvFields')
const helpers = require('../helpers')
const { logger } = require('../../../../logger')

const rowOffset = 2 // Takes into account the header row and the row index starting from 0

const expectedHeadings = Object.keys(csvFields).map(heading => snakeCase(heading))

/**
 * Validates that all the headings (the first column) are
 * not modified since the original download of the CSV template.
 */
const validateHeadings = headings => {
  const errors = []
  const extraHeadings = headings.filter(heading => !expectedHeadings.includes(heading))
  const missingHeadings = expectedHeadings.filter(heading => !headings.includes(heading))
  if (extraHeadings.length) {
    errors.push(`Unexpected headings: ${extraHeadings.join(', ')}`)
  }
  if (missingHeadings.length) {
    errors.push(`Missing headings: ${missingHeadings.join(', ')}`)
  }
  return errors
}

const validateRows = async (rows, headings, jobName) => {
  const validateField = async (heading, val, licence, columns, validator = []) => {
    for (const test of validator) {
      const message = await test(heading, val, licence, headings, columns)

      // We return the first error we encounter
      if (message) {
        return message
      }
    }
  }

  const validateRow = async (columns, rowIndex) => {
    logger.info(`${jobName}: validating row ${rowIndex} of ${rows.length}`)

    // TODO: get column number of `licence_number` and change to `(columns[3])` (or whatever)
    const licence = await helpers.getLicence(columns[headings.indexOf('licence_number')])

    const fields = headings.map((heading, colIndex) => ({ heading, val: columns[colIndex] }))

    const errors = []

    for (const { heading, val } of fields) {
      const { skip = [], validate: validator, allow = [] } = csvFields[camelCase(heading)] || {}

      // TODO: possibly refactor to a `allowEmpty` flag
      if (allow.includes(val)) {
        continue
      }

      // TODO: refactor to make more specific? for chargeElementTimeLimitStart/...End
      if (skip.length) {
        // In this case when a message is returned the validator will be skipped
        const validationSkipped = await validateField(heading, val, licence, columns, skip)
        if (validationSkipped) {
          continue
        }
      }

      if (validator) {
        const error = await validateField(heading, val, licence, columns, validator)
        if (error) {
          errors.push(`Row ${rowIndex + rowOffset}, ${error}`)
        }
      }
    }

    return errors
  }

  const invalidRows = []

  // Generate array of index/value outside the loop so we don't do this each time
  const rowsToProcess = rows.entries()

  for (const [index, row] of rowsToProcess) {
    const rowErrors = await validateRow(row, index)
    invalidRows.push(...rowErrors)
  }

  return invalidRows
}

const validateGroups = async (rows, headings, jobName) => {
  const getCategoryProperties = row => {
    return {
      charge_reference_details_source: row[headings.indexOf('charge_reference_details_source')],
      charge_reference_details_loss: row[headings.indexOf('charge_reference_details_loss')],
      charge_reference_details_volume: row[headings.indexOf('charge_reference_details_volume')],
      charge_reference_details_water_availability: row[headings.indexOf('charge_reference_details_water_availability')],
      charge_reference_details_modelling: row[headings.indexOf('charge_reference_details_modelling')]
    }
  }

  const getBillingAccountRef = row => row[headings.indexOf('charge_information_billing_account')]
  const getStartDate = row => row[headings.indexOf('charge_information_start_date')]

  logger.info(`${jobName}: sorting rows`)
  const sortedRows = sortBy(rows.map((row, index) => {
    const licenceNumber = row[headings.indexOf('licence_number')]
    const chargeReferenceDetailsChargeElementGroup = row[headings.indexOf('charge_reference_details_charge_element_group')]
    const rowNumber = index + rowOffset
    return { licenceNumber, chargeReferenceDetailsChargeElementGroup, rowNumber, row }
  }), ['licenceNumber', 'chargeReferenceDetailsChargeElementGroup'])
  return sortedRows.reduce((errors, current, rowIndex) => {
    if (rowIndex === 0) {
      return errors
    }

    const previous = sortedRows[rowIndex - 1]
    if (current.licenceNumber !== previous.licenceNumber) {
      logger.info(`${jobName}: validating rows for licence ${current.licenceNumber}`)
      return errors
    }

    logger.info(`${jobName}: validating row ${previous.rowNumber} with row ${current.rowNumber}`)

    const currentCategoryDetails = getCategoryProperties(current.row)
    const previousCategoryDetails = getCategoryProperties(previous.row)

    let categoryErrors = []

    if (current.chargeReferenceDetailsChargeElementGroup === previous.chargeReferenceDetailsChargeElementGroup) {
      if (current.chargeReferenceDetailsChargeElementGroup === 'A') {
        if (isEqual(currentCategoryDetails, previousCategoryDetails)) {
          categoryErrors = [`Row ${previous.rowNumber}, has the same licence and references as row ${current.rowNumber} and both are in group A`]
        }
      } else if (!isEqual(currentCategoryDetails, previousCategoryDetails)) {
        categoryErrors = Object.keys(currentCategoryDetails).reduce((differences, heading) => {
          if (currentCategoryDetails[heading] === previousCategoryDetails[heading]) {
            return differences
          } else {
            return [
              ...differences,
              `Row ${previous.rowNumber}, has the same licence and group as row ${current.rowNumber} but ${heading} is different`
            ]
          }
        }, [])
      }
    }
    if (getBillingAccountRef(previous.row) !== getBillingAccountRef(current.row)) {
      categoryErrors.push(`Row ${previous.rowNumber}, has the same licence as row ${current.rowNumber} but charge_information_billing_account is different`)
    }
    if (getStartDate(previous.row) !== getStartDate(current.row)) {
      categoryErrors.push(`Row ${previous.rowNumber}, has the same licence as row ${current.rowNumber} but charge_information_start_date is different`)
    }
    return [...errors, ...categoryErrors]
  }, [])
}

const createValidationResult = (validationErrors, errorType) => validationErrors.length
  ? {
      errorType,
      validationErrors,
      isValid: false
    }
  : { isValid: true }

const validate = async (csv, event, jobName) => {
  try {
    const data = await csvParser.parseCsv(csv)

    if (data.length === 0) {
      return createValidationResult(['Empty file'], 'empty')
    }

    const [headings, ...rows] = data

    // validate the headings
    const headerErrors = validateHeadings(headings)

    if (headerErrors.length) {
      return createValidationResult(headerErrors, 'headers')
    }

    // headings are good, validate the row data
    await helpers.updateEventStatus(event, 'validating rows', jobName)
    const rowErrors = await validateRows(rows, headings, jobName)
    await helpers.updateEventStatus(event, 'validating row combinations', jobName)
    const rowGroupingErrors = await validateGroups(rows, headings, jobName)
    return createValidationResult([...rowErrors, ...rowGroupingErrors].sort(), 'rows')
  } catch (err) {
    return createValidationResult([err.message], 'parse')
  }
}

exports.validate = validate
