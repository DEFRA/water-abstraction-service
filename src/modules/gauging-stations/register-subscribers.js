'use strict';

const syncGaugingStationsFromSourceCsv = require('./jobs/sync-gauging-stations');
const syncGaugingStationsLinkagesFromDigitise = require('./jobs/sync-licence-gauging-stations-from-digitise');

module.exports = {
  name: 'gauging-station-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(syncGaugingStationsFromSourceCsv)
      .register(syncGaugingStationsLinkagesFromDigitise);

    server.queueManager.add(syncGaugingStationsFromSourceCsv.jobName);
    server.queueManager.add(syncGaugingStationsLinkagesFromDigitise.jobName);
  }
};
