'use strict'

const factory = require('../service-version-factory')
const config = require('../../../../config')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const urlJoin = require('url-join')

/**
 * Posts to import module to re-import charging data
 * @return {Promise}
 */
const postImportChargeVersions = () => {
  const uri = urlJoin(config.services.import, 'charging')
  return serviceRequest.post(uri)
}

exports.getServiceVersion = factory.create(config.services.import)
exports.postImportChargeVersions = postImportChargeVersions
