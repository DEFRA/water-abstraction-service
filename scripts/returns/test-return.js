'use strict'

const waterHelpers = require('@envage/water-abstraction-helpers')

const startDate = '2018-11-01'
const endDate = '2019-03-01'

const createTestReturnId = existingReturn => {
  return waterHelpers.returns.getReturnId(
    existingReturn.metadata.nald.regionCode,
    existingReturn.licence_ref,
    existingReturn.return_requirement,
    startDate,
    endDate
  )
}

/**
 * Creates a new return object based on the existing return, but certain
 * properties will be reset to create a due return in a known date range.
 *
 * Also adds the copiedForTesting flag to the metadata to help identify
 * test returns that have been created.
 *
 * @param {Object} existingReturn The valid return from the service that is to be modified
 * @returns {Object} The modified test return
 */
const create = existingReturn => {
  const returnId = createTestReturnId(existingReturn, startDate, endDate)

  const testReturn = { ...existingReturn }

  testReturn.return_id = returnId
  testReturn.status = 'due'
  testReturn.start_date = startDate
  testReturn.end_date = endDate
  testReturn.metadata.version = 1
  testReturn.metadata.isCurrent = true
  testReturn.metadata.copiedForTesting = true
  testReturn.received_date = null
  testReturn.due_date = '2019-04-01'
  testReturn.under_query = false

  delete testReturn.created_at
  delete testReturn.updated_at
  delete testReturn.under_query_comment

  return testReturn
}

exports.create = create
