const startUpload = require('./jobs/update-charge-information-start')
const mapToJson = require('./jobs/update-charge-information-to-json')
const updateChargeInformation = require('./jobs/update-charge-information-save')

module.exports = {
  name: 'chargeInformationRegisterSubscribersBullMQ',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(startUpload)
      .register(mapToJson)
      .register(updateChargeInformation)
  }
}
