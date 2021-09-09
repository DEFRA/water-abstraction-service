const controller = require('./controller');
const { version } = require('../../../config');

module.exports = {

  getSearch: {
    method: 'GET',
    path: `/water/${version}/internal-search`,
    handler: controller.getInternalSearch,
    config: {
      description: 'Provides a search API for internal users'
    }
  }
};
