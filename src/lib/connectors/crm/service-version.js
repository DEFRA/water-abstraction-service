const factory = require('../service-version-factory')
const config = require('../../../../config')

exports.getServiceVersion = factory.create(config.services.crm)
