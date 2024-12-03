'use strict'

const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**
 * Posts to system repo to flag the licence for SROC supplementary billing
 * @return {Promise}
 */
const licenceFlagSupplementaryBilling = (licenceId, scheme) => {
  const url = `${config.services.system}/licences/supplementary`
  const options = {
    body: {
      licenceId,
      scheme
    }
  }

  return serviceRequest.post(url, options)
}

exports.licenceFlagSupplementaryBilling = licenceFlagSupplementaryBilling
