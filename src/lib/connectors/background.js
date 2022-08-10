'use strict'

const config = require('../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**

 * @return {Promise}
 */
const registerWorker = (jobName) => {
  const url = new URL('worker/register_X', config.services.background)
  return serviceRequest.post(url.href, { body: { jobName } })
}

module.exports = {
  registerWorker
}
