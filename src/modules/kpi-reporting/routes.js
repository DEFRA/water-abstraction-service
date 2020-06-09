
const controller = require('../controller');
const { version } = require('../../../../config');

const pathPrefix = `/water/${version}/kpi-reporting/`;

module.exports = {

  getNamingLicencesKPIdata: {
    method: 'GET',
    path: `${pathPrefix}/naming-licences`,
    handler: controller.getNamingLicences,
    config: {
      description: 'Returns current year KPI data for naming of licences from events'
    }
  }
};
