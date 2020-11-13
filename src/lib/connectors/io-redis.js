'use strict';

const IORedis = require('ioredis');
const config = require('../../../config');

exports.ioredis = new IORedis(
  config.redis
);
