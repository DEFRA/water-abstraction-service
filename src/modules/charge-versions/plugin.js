'use strict'

const createChargeVersionWorkflows = require('./jobs/create-charge-version-workflows')
const licenceNotInChargeVersionWorkflow = require('./jobs/licence-not-in-charge-version-workflow')

const registerSubscribers = async (server) => {
  server.queueManager
    .register(licenceNotInChargeVersionWorkflow)
    .register(createChargeVersionWorkflows)
}

exports.plugin = {
  name: 'charge-version-workflow-jobs',
  dependencies: ['hapiBull'],
  register: registerSubscribers
}
