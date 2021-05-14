'use strict';

const IORedis = require('ioredis');
const config = require('../../../config');

exports.createConnection = () => {
  const ioRedis = new IORedis(config.redis.connection);
  ioRedis.setMaxListeners(config.redis.maxListenerCount);
  return ioRedis;
};
