const jobs = {
  start: require('./start-upload'),
  mapToJson: require('./map-to-json'),
  validateReturns: require('./validate-returns'),
  persist: require('./persist-returns')
};

const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(jobs.start.jobName, jobs.start.handler);
  await messageQueue.subscribe(jobs.mapToJson.jobName, jobs.mapToJson.handler);

  await messageQueue.onComplete(jobs.start.jobName, async job => {
    if (job.data.failed) return messageQueue.stop();
    // Bulk upload document has been validated against schema.
    // Publish a new job which will convert the valid XML/CSV into a JSON blob.
    const { eventId, companyId } = job.data.request.data;
    await jobs.mapToJson.publish({ eventId, companyId });
  });

  await messageQueue.subscribe(jobs.validateReturns.jobName, jobs.validateReturns.handler);

  await messageQueue.onComplete(jobs.mapToJson.jobName, async job => {
    const { eventId, companyId } = job.data.request.data;
    await jobs.validateReturns.publish({ eventId, companyId });
  });

  await messageQueue.subscribe(jobs.persist.jobName, jobs.persist.handler);
};

module.exports = {
  registerSubscribers
};
