'use strict';

const syncGaugingStationsFromSourceCsv = require('./jobs/sync-gauging-stations');
const syncLicenceConditionsFromDigitise = require('./jobs/sync-licence-conditions-from-digitise');
const syncGaugingStationsLinkagesFromDigitise = require('./jobs/sync-licence-gauging-stations-from-digitise');

module.exports = {
  name: 'gauging-station-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(syncGaugingStationsFromSourceCsv)
      .register(syncLicenceConditionsFromDigitise)
      .register(syncGaugingStationsLinkagesFromDigitise);

    server.queueManager.add(syncGaugingStationsFromSourceCsv.jobName);
    server.queueManager.add(syncLicenceConditionsFromDigitise.jobName);
    server.queueManager.add(syncGaugingStationsLinkagesFromDigitise.jobName);
  }
};
