'use strict'

const controller = require('./controller')

const getRegions = {
  method: 'GET',
  path: '/water/1.0/regions',
  handler: controller.getRegions,
  config: {
    description: 'Gets the regions that the system contains'
  }
}

exports.getRegions = getRegions
