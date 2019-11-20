const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const processChargeVersions = require('./jobs/process-charge-versions');

const handlePopulateBatchChargeVersionsComplete = require('./jobs/populate-batch-charge-versions-complete');
const handleProcessChargeVersionsComplete = require('./jobs/process-charge-versions-complete');

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.messageQueue.subscribe(populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler);
    await server.messageQueue.onComplete(populateBatchChargeVersions.jobName, job => {
      return handlePopulateBatchChargeVersionsComplete(job, server.messageQueue);
    });

    await server.messageQueue.subscribe(processChargeVersions.jobName, processChargeVersions.handler);
    await server.messageQueue.onComplete(processChargeVersions.jobName, job => handleProcessChargeVersionsComplete(job));
  }
};
