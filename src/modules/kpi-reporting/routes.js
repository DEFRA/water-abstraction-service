'use strict'

const controller = require('./controller')
const { version } = require('../../../config')

const pathPrefix = `/water/${version}/kpi-reporting`

exports.getNamingLicencesKpidata = {
  method: 'GET',
  path: `${pathPrefix}`,
  handler: controller.getKpiData,
  config: {
    description: 'Returns all the data for KPI UI'
  }
}
