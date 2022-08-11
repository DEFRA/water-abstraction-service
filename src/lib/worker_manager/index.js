'use strict'

const WorkerManager = require('./worker-manager')
const ioRedis = require('../connectors/io-redis')

function getWorkerManager () {
  if (getWorkerManager.instance) {
    return getWorkerManager.instance
  }

  const connection = ioRedis.createConnection()

  getWorkerManager.instance = new WorkerManager(connection)

  return getWorkerManager.instance
}

module.exports.plugin = {
  register: async server => {
    const workerManager = getWorkerManager()
    server.decorate('server', 'workerManager', workerManager)
    server.decorate('request', 'workerManager', workerManager)
  },
  pkg: {
    name: 'hapi-bull-worker'
  }
}

module.exports.getWorkerManager = getWorkerManager
