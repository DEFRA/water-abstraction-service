require('dotenv').config();
const pg = require('pg');
const moment = require('moment');
const helpers = require('@envage/water-abstraction-helpers');

const config = require('../../../config.js');
const { logger } = require('../../logger');

const DATE_FORMAT = 'YYYY-MM-DD';
const dateMapper = str => moment(str).format(DATE_FORMAT);

// Set dates to format YYYY-MM-DD rather than full date/time string with timezone
pg.types.setTypeParser(pg.types.builtins.DATE, dateMapper);

exports.pool = helpers.db.createPool(config.pg, logger);
exports._dateMapper = dateMapper;
