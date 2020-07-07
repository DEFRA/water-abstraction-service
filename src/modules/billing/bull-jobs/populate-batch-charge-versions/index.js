'use strict';

const queueFactory = require('../lib/queue-factory');
module.exports = queueFactory.createQueue(require('./config'));
