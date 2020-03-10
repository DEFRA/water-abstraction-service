const bookshelf = require('bookshelf');
const config = require('../../../../config.js');

// Setting up the database connection
const knex = require('knex')({
  client: 'pg',
  connection: config.pg.connectionString,
  searchPath: ['water'],
  pool: { min: 0, max: 1 }
});

// Create instance and register camel case converter
const bookshelfInstance = bookshelf(knex);

// Register plugins
bookshelfInstance.plugin('bookshelf-case-converter-plugin');
bookshelfInstance.plugin('bookshelf-json-columns');

exports.bookshelf = bookshelfInstance;
