'use strict';

const IORedis = require('ioredis');
const config = require('../../../config');

// Note: this limit will need increasing if further Bull MQ job queues are added
const maxListenerCount = 23;

exports.createConnection = () => {
  const ioRedis = new IORedis(config.redis);
  ioRedis.setMaxListeners(maxListenerCount);
  return ioRedis;
};
