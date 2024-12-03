'use strict'

const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**
 * Posts to the system repo to flag a licence for SROC supplementary billing
 *
 * This route is only taken for workflow records that have been deleted by a user either removing the licence from
 * workflow or by declining the charge version that was awaiting approval
 *
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
