'use strict';

const createChargeVersionWorkflows = require('./jobs/create-charge-version-workflows');

module.exports = {
  name: 'charge-version-workflow-jobs',
  register: async server => server.queueManager.register(createChargeVersionWorkflows)
};
