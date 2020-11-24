'use strict';

const IORedis = require('ioredis');
const config = require('../../../config');

exports.createConnection = () => new IORedis(config.redis);
