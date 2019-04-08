const jobs = {
  getRecipients: require('./get-recipients')
};

/**
 * Registers subscribers with the PG Boss message queue
 * @param  {Object}  messageQueue - PG boss message queue
 * @return {Promise}              resolves when all jobs registered
 */
const registerSubscribers = async messageQueue => {
  await messageQueue.subscribe(jobs.getRecipients.jobName, jobs.getRecipients.handler);
};

module.exports = {
  registerSubscribers
};
