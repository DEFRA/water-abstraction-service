const jobs = require('./jobs');

module.exports = {
  name: 'importRegisterSubscribers',
  register: async server => {
    await server.createSubscription(jobs.s3Download);
    await server.createSubscription(jobs.populatePendingImport);
    await server.createSubscription(jobs.importLicence);
  }
};
