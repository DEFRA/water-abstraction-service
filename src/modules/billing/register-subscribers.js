const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const handlePopulateBatchChargeVersionsComplete = require('./jobs/populate-batch-charge-versions-complete');

const processChargeVersion = require('./jobs/process-charge-version');
const handleProcessChargeVersionComplete = require('./jobs/process-charge-version-complete');

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.messageQueue.subscribe(populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler);
    await server.messageQueue.onComplete(populateBatchChargeVersions.jobName, job => {
      return handlePopulateBatchChargeVersionsComplete(job, server.messageQueue);
    });

    await server.messageQueue.subscribe(processChargeVersion.jobName, processChargeVersion.handler);
    await server.messageQueue.onComplete(processChargeVersion.jobName, job => handleProcessChargeVersionComplete(job));
  }
};
