const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')
const urlJoin = require('url-join')

const deleteAcceptanceTestData = () => {
  const url = urlJoin(config.services.idm, 'acceptance-tests')
  return serviceRequest.delete(url)
}

exports.deleteAcceptanceTestData = deleteAcceptanceTestData
