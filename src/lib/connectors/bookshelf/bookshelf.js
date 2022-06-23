'use strict'

const bookshelf = require('bookshelf')

const { knex } = require('../knex')

// Create instance and register camel case converter
const bookshelfInstance = bookshelf(knex)

// Register plugins
bookshelfInstance.plugin('bookshelf-case-converter-plugin')
bookshelfInstance.plugin('bookshelf-json-columns')

exports.bookshelf = bookshelfInstance
