const startUpload = require('./lib/jobs/start-upload')
const mapToJson = require('./lib/jobs/map-to-json')
const validateReturns = require('./lib/jobs/validate-returns')
const persistReturns = require('./lib/jobs/persist-returns')

module.exports = {
  name: 'returnsRegisterSubscribersBullMQ',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(startUpload)
      .register(mapToJson)
      .register(validateReturns)
      .register(persistReturns)
  }
}
