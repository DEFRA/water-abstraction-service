'use strict';

const { db } = require('@envage/water-abstraction-helpers');
const knex = require('./knex');
const query = (...args) => knex.knex.raw(...db.mapQueryToKnex(...args));

exports.pool = {
  query,
  end: () => knex.knex.destroy()
};
