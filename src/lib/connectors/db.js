require('dotenv').config();
const config = require('../../../config.js');
const helpers = require('@envage/water-abstraction-helpers');
const { logger } = require('../../logger');

exports.pool = helpers.db.createPool(config.pg, logger);
