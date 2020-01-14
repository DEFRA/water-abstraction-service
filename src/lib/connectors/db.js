require('dotenv').config();
const pg = require('pg');
const moment = require('moment');
const helpers = require('@envage/water-abstraction-helpers');

const config = require('../../../config.js');
const { logger } = require('../../logger');

// Set dates to format YYYY-MM-DD rather than full date/time string with timezone
const DATE_FORMAT = 'YYYY-MM-DD';
pg.types.setTypeParser(pg.types.builtins.DATE, str => moment(str).format(DATE_FORMAT));

exports.pool = helpers.db.createPool(config.pg, logger);
