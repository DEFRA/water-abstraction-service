
const controller = require('./controller');
const { version } = require('../../../config');

const pathPrefix = `/water/${version}/kpi-reporting`;

module.exports = {

  getNamingLicencesKPIdata: {
    method: 'GET',
    path: `${pathPrefix}`,
    handler: controller.getKPIData,
    config: {
      description: 'Returns all the data for KPI UI'
    }
  }
};
