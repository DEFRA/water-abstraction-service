'use strict';

const QueueManager = require('./QueueManager');
const ioRedis = require('../connectors/io-redis');

/**
 * Gets a singleton instance of the queueManager
 * @return {QueueManager}
 */
function getQueueManager () {
  if (getQueueManager._instance) {
    return getQueueManager._instance;
  }
  // Create Redis connection
  const connection = ioRedis.createConnection();

  // Create queue manager instance
  getQueueManager._instance = new QueueManager(connection);
  return getQueueManager._instance;
}

const queueManager = getQueueManager();

module.exports.plugin = {
  register: async server => {
    // Register instance with Hapi
    server.decorate('server', 'queueManager', queueManager);
    server.decorate('request', 'queueManager', queueManager);
  },
  pkg: {
    name: 'hapiBull',
    version: '1.0'
  }
};
exports.queueManager = queueManager;
module.exports.getQueueManager = getQueueManager;
