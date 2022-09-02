const { serviceRequest, urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const deleteAcceptanceTestData = () => {
  const url = urlJoin(config.services.idm, 'acceptance-tests')
  return serviceRequest.delete(url)
}

exports.deleteAcceptanceTestData = deleteAcceptanceTestData
