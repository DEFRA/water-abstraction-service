const jobs = require('./lib/jobs');

module.exports = {
  name: 'returnsRegisterSubscribers',
  register: async server => {
    await server.createSubscription(jobs.startUpload);
    await server.createSubscription(jobs.mapToJson);
    await server.createSubscription(jobs.validateReturns);
    await server.createSubscription(jobs.persistReturns);
  }
};
