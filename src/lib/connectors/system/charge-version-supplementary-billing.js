'use strict'

const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**
 * Posts to system repo to flag new charge versions for SROC supplementary billing
 * @return {Promise}
 */
const chargeVersionFlagSupplementaryBilling = (chargeVersionId) => {
  const url = `${config.services.system}/licences/supplementary`
  const options = {
    body: {
      chargeVersionId
    }
  }

  return serviceRequest.post(url, options)
}

exports.chargeVersionFlagSupplementaryBilling = chargeVersionFlagSupplementaryBilling
