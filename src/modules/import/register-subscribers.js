const cron = require('node-cron');
const config = require('../../../config');
const jobs = require('./jobs');

const getSchedule = () => config.isProduction ? '0 1 * * *' : '0 13 * * *';

const publishJob = messageQueue => {
  messageQueue.publish(jobs.s3Download.job.createMessage());
};

module.exports = {
  name: 'importRegisterSubscribers',
  register: async server => {
    await server.createSubscription(jobs.s3Download);
    await server.createSubscription(jobs.populatePendingImport);
    await server.createSubscription(jobs.importLicence);

    // Schedule the import process every day at 1am / 1pm depending on environment
    cron.schedule(getSchedule(), () => publishJob(server.messageQueue));
  }
};
