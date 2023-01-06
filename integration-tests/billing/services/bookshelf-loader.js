'use strict'

const { bookshelf } = require('../../../src/lib/connectors/bookshelf')

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const BookshelfAdapter = require('./fixture-loader/adapters/BookshelfAdapter')

// Resolve path to fixtures directory
const path = require('path')
const moment = require('moment')
const dir = path.resolve(__dirname, '../fixtures')

// 😡 😱 What is going on here?
//
// So, when creating SROC charge versions we need to link to a charge category (handily called billing_charge_categories
// in the database - we know, go figure!). This is a lookup table of references that have charges linked to them. The
// table is seeded when a new environment is built and uses GUID's for ID's. This means we cannot just hardcode an ID in
// a charge element fixture like, for example, `sroc-charge-info.yaml`.
//
// We _could_ create a 'test' charge category. But as it's a fundamental part of how SROC works we didn't want to cause
// confusion down the road should a bill run (called a batch in the code and database 🙄) not calculate as expected.
//
// This means we need to query the DB to get an ID. That gives us another problem. Querying a DB is an asynchronous
// operation; async/await. But `create()` down below is not an async method which means we cannot await the result of
// any async calls within it.
//
// "Just make it async" you say. Well, thanks to the way `create()` is used that becomes a problem. See
// `integration-tests/billing/services/loader.js` which does the following
//
//   # ...
//   idm: require('../services/idm-loader')(),
//   water: require('../services/bookshelf-loader')(),
//   permits: require('../services/permits-loader')(),
//   # ...
//
// It is immediately invoking `create()` and setting the return value for the property `water:`. And `water:` is part of
// an object being created on the fly and passed into ` new SetLoader()`. So, we'd have to do some major re-writing of
// how all that works just to support `create()` becoming async. 😩
//
// So, instead we mix up async/await with some old fashioned promise callbacks. We wrap our call to the DB with the
// async method `getChargeCategories()`. It's going to return a promise when called from a non-async method. So, we use
// `then()` to add a callback to the promise. In the callback we can get the returned values and assign them to the
// loader.
//
// That brings us to what is going on here. Unlike the other loaders we declare `loader` at the top level of the module
// rather than in `create()`. We do this so both `create()` and the anonymous callback function we use in `then()` can
// access the same object. This allows us to set the charge category as a 'ref', which can be referred to in
// fixtures like `sroc-charge-info.yaml`.
//
// It isn't pretty, it is ridiculously complex, and it's all for one weird edge case. But it solves this specific
// problem without resorting to re-writing how integration-tests works.
//
// ¯\_(ツ)_/¯
const bookshelfAdapter = new BookshelfAdapter(bookshelf)
const loader = new FixtureLoader(bookshelfAdapter, dir)

const getChargeCategories = async () => {
  const { rows } = await bookshelf.knex.raw(
    "SELECT * FROM water.billing_charge_categories WHERE reference IN ('4.1.1', '4.2.1', '4.2.10') ORDER BY reference"
  )

  return [
    {
      name: '$chargeCategory411',
      obj: { ...rows[0] }
    },
    {
      name: '$chargeCategory421',
      obj: { ...rows[1] }
    },
    {
      name: '$chargeCategory4210',
      obj: { ...rows[2] }
    }
  ]
}

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
  const refDates = {
    name: '$financialDates',
    obj: {
      startDate: getChargeVersionStartDate().format('YYYY-MM-DD')
    }
  }
  loader.setRef(refDates.name, refDates.obj)

  getChargeCategories().then((chargeVersions) => {
    for (const chargeVersion of chargeVersions) {
      loader.setRef(chargeVersion.name, chargeVersion.obj)
    }
  })

  return loader
}

module.exports = create
