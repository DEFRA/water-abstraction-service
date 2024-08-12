'use strict'

const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**
 * Posts to
 * @return {Promise}
 */
const flagSupplementaryBilling = (chargeVersionId) => {
  const url = `${config.services.system}/licences/supplementary-flag`
  const options = {
    body: {
      chargeVersionId
    }
  }

  return serviceRequest.post(url, options)
}

exports.flagSupplementaryBilling = flagSupplementaryBilling
