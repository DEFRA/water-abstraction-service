'use strict'

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const getKPIAccessRequests = async () => {
  const uri = `${config.services.crm}/kpi/access-requests`
  return serviceRequest.get(uri)
}

exports.getKPIAccessRequests = getKPIAccessRequests
