const checkStatus = require('./lib/jobs/check-status');
const sendMessages = require('./lib/jobs/send-message');
const refreshEvents = require('./lib/jobs/refresh-event');
const getRecipients = require('./lib/jobs/get-recipients');

module.exports = {
  name: 'batch-notifications',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(checkStatus)
      .register(sendMessages)
      .register(refreshEvents)
      .register(getRecipients);

    server.queueManager.add(checkStatus.jobName);
    server.queueManager.add(sendMessages.jobName);
    server.queueManager.add(refreshEvents.jobName);
  }
};
