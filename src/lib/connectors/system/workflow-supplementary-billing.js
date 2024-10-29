'use strict'

const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**
 * Posts to system repo to flag new charge versions for SROC supplementary billing
 * @return {Promise}
 */
const workflowFlagSupplementaryBilling = (workflowId) => {
  const url = `${config.services.system}/licences/supplementary`
  const options = {
    body: {
      workflowId
    }
  }

  return serviceRequest.post(url, options)
}

exports.workflowFlagSupplementaryBilling = workflowFlagSupplementaryBilling

// This route takes two ways. A workflow record being manually deleted or a charge version not being approved and there
// fore the workflow record deleted.
