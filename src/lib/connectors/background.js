'use strict'

const config = require('../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

/**

 * @return {Promise}
 */
const registerWorker = (jobName) => {
  const url = new URL('worker/register', config.services.background)
  console.log('🚀 ~ file: background.js ~ line 12 ~ registerWorker ~ url', url)
  try {
    return serviceRequest.post(url.href, { body: { jobName } })
  } catch (error) {
    // console.log('🚀 ~ file: background.js ~ line 16 ~ registerWorker ~ error', error)
  }
}

module.exports = {
  registerWorker
}
