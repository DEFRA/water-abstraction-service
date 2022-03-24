const startUpload = require('./jobs/start-upload');
const mapToJson = require('./jobs/map-to-json');
const updateChargeInformation = require('./jobs/update-charge-information');

module.exports = {
  name: 'chargeInformationRegisterSubscribersBullMQ',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(startUpload)
      .register(mapToJson)
      .register(updateChargeInformation);
  }
};
