const apiClientFactory = require('../api-client-factory')
const { urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const kpiClient = apiClientFactory.create(urlJoin(config.services.crm, 'kpi'))

exports.kpiClient = kpiClient
