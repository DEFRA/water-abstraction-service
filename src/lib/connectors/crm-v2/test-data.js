'use strict'

const urlJoin = require('url-join')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

/**
 * Deletes all the test data from the CRM
 *
 */
const deleteTestData = () => {
  const url = urlJoin(config.services.crm_v2, 'test-data')
  return serviceRequest.delete(url)
}

exports.deleteTestData = deleteTestData
