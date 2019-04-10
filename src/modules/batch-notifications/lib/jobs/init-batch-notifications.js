const jobs = {
  getRecipients: require('./get-recipients'),
  sendMessage: require('./send-message'),
  refreshEvent: require('./refresh-event')
};

/**
 * Registers subscribers with the PG Boss message queue
 * @param  {Object}  messageQueue - PG boss message queue
 * @return {Promise}              resolves when all jobs registered
 */
const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(jobs.getRecipients.jobName, jobs.getRecipients.handler);
  await messageQueue.subscribe(jobs.sendMessage.jobName, jobs.sendMessage.handler);
  await messageQueue.subscribe(jobs.refreshEvent.jobName, jobs.refreshEvent.handler);
};

module.exports = {
  registerSubscribers
};
