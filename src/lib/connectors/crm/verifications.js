const apiClientFactory = require('../api-client-factory')
const { urlJoin } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const verificationsClient = apiClientFactory.create(urlJoin(config.services.crm, 'verification'))

exports.verificationsClient = verificationsClient
