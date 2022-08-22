'use strict'

const syncGaugingStationsFromSourceCsv = require('./jobs/sync-gauging-stations')
const syncGaugingStationsLinkagesFromDigitise = require('./jobs/sync-licence-gauging-stations-from-digitise')
const syncLVPCFromDigitise = require('./jobs/sync-licence-version-purpose-conditions-from-digitise')

module.exports = {
  name: 'gauging-station-jobs',
  dependencies: ['hapiBull'],
  register: async server => {
    server.queueManager
      .register(syncGaugingStationsFromSourceCsv)
      .register(syncGaugingStationsLinkagesFromDigitise)
      .register(syncLVPCFromDigitise)
  }
}
