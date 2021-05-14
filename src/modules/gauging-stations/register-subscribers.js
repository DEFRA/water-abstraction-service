'use strict';

const syncGaugingStations = require('./jobs/sync-gauging-stations');

module.exports = {
  name: 'gauging-station-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(syncGaugingStations);

    server.queueManager.add(syncGaugingStations.jobName);
  }
};
