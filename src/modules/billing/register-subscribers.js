const jobs = require('./jobs');

const createSubscription = async (server, jobContainer) => {
  const { job: billingJob, onCompleteHandler } = jobContainer;

  await server.messageQueue.subscribe(
    billingJob.jobName,
    billingJob.options || {},
    billingJob.handler

  );

  if (onCompleteHandler) {
    await server.messageQueue.onComplete(
      billingJob.jobName,
      job => onCompleteHandler(job, server.messageQueue)
    );
  }
};

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await createSubscription(server, jobs.populateBatchChargeVersions);
    await createSubscription(server, jobs.processChargeVersion);
    await createSubscription(server, jobs.prepareTransactions);
    await createSubscription(server, jobs.createCharge);
  }
};
