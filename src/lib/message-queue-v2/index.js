'use strict';

const QueueManager = require('./QueueManager');
const ioRedis = require('../connectors/io-redis');

module.exports.plugin = {
  register: async server => {
    // Create Redis connection
    const connection = ioRedis.createConnection();

    // Create queue manager instance
    const queueManager = new QueueManager(connection);

    // Register instance with Hapi
    server.decorate('server', 'queueManager', queueManager);
    server.decorate('request', 'queueManager', queueManager);
  },
  pkg: {
    name: 'hapiBull',
    version: '1.0'
  }
};
