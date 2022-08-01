'use strict'
const { bookshelf } = require('../../../src/lib/connectors/bookshelf')

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const BookshelfAdapter = require('./fixture-loader/adapters/BookshelfAdapter')

// Resolve path to fixtures directory
const path = require('path')
const moment = require('moment')
const dir = path.resolve(__dirname, '../fixtures')

const getChargeVersionStartDate = () => {
  const chargeVersionStartDate = moment()
  chargeVersionStartDate.set('month', 3) // April
  chargeVersionStartDate.set('date', 1)
  if (moment().month() <= 2) {
    chargeVersionStartDate.subtract(2, 'year')
  } else {
    chargeVersionStartDate.subtract(1, 'year')
  }
  return chargeVersionStartDate
}

const create = () => {
// Create Bookshelf fixture loader
  const refDates = {
    name: '$financialDates',
    obj: {
      startDate: getChargeVersionStartDate().format('YYYY-MM-DD')
    }
  }
  const bookshelfAdapter = new BookshelfAdapter(bookshelf)
  return new FixtureLoader(bookshelfAdapter, dir, refDates)
}

module.exports = create
