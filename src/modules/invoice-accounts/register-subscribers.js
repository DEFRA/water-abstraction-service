const jobs = require('./jobs');

module.exports = {
  name: 'customersRegisterSubscribers',
  register: async server => {
    // Update customer records in CM
    await server.createSubscription(jobs.updateCustomer);
  }
};
