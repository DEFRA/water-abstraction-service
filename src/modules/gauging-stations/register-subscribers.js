'use strict';

const syncGaugingStationsFromSourceCsv = require('./jobs/sync-gauging-stations');
const syncGaugingStationsLinkagesFromDigitise = require('./jobs/sync-licence-gauging-stations-from-digitise');
const syncLVPCFromDigitise = require('./jobs/sync-licence-version-purpose-conditions-from-digitise');

module.exports = {
  name: 'gauging-station-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    await server.queueManager.deleteKeysByPattern('*' + syncGaugingStationsFromSourceCsv.jobName + '*');
    await server.queueManager.deleteKeysByPattern('*' + syncGaugingStationsLinkagesFromDigitise.jobName + '*');
    await server.queueManager.deleteKeysByPattern('*' + syncLVPCFromDigitise.jobName + '*');

    server.queueManager
      .register(syncGaugingStationsFromSourceCsv)
      .register(syncGaugingStationsLinkagesFromDigitise)
      .register(syncLVPCFromDigitise);

    server.queueManager.add(syncGaugingStationsFromSourceCsv.jobName);
    server.queueManager.add(syncGaugingStationsLinkagesFromDigitise.jobName);
    server.queueManager.add(syncLVPCFromDigitise.jobName);
  }
};
