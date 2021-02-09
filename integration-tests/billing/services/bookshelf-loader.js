'use strict';
const { bookshelf } = require('../../../src/lib/connectors/bookshelf');

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const BookshelfAdapter = require('./fixture-loader/adapters/BookshelfAdapter');

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = () => {
// Create Bookshelf fixture loader
  const bookshelfAdapter = new BookshelfAdapter(bookshelf);
  return new FixtureLoader(bookshelfAdapter, dir);
};

module.exports = create;
