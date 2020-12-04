'use strict';

const pg = require('pg');
const moment = require('moment');

const DATE_FORMAT = 'YYYY-MM-DD';
const dateMapper = str => moment(str).format(DATE_FORMAT);
const config = require('../../../config');

// Set dates to format YYYY-MM-DD rather than full date/time string with timezone
pg.types.setTypeParser(pg.types.builtins.DATE, dateMapper);

// Setting up the database connection
const knex = require('knex')({
  client: 'pg',
  connection: config.pg.connectionString,
  pool: { min: 0, max: config.pg.max }
});

exports.knex = knex;
exports._dateMapper = dateMapper;
