'use strict'

const SetLoader = require('./fixture-loader/SetLoader')

const createSetLoader = () => {
  return new SetLoader({
    crmV1: require('../services/crm-v1-loader')(),
    crmV2: require('../services/crm-v2-loader')(),
    idm: require('../services/idm-loader')(),
    water: require('../services/bookshelf-loader')(),
    permits: require('../services/permits-loader')(),
    returns: require('../services/returns-loader')()
  })
}

exports.createSetLoader = createSetLoader
