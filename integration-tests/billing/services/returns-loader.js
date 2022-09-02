'use strict'

const FixtureLoader = require('./fixture-loader/FixtureLoader')
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter')

const { serviceRequest, urlJoin, returns } = require('@envage/water-abstraction-helpers')
const config = require('../../../config')
const createReturnsUrl = (...parts) => urlJoin(config.services.returns, ...parts)
const moment = require('moment')
const { last } = require('lodash')

// Resolve path to fixtures directory
const path = require('path')
const dir = path.resolve(__dirname, '../fixtures')

const createConnector = tail => async body => {
  const { data } = await serviceRequest.post(createReturnsUrl(tail), { body })
  return data
}

const create = () => {
  // todo this might need to be tweaked again or the year calculated dynamically.
  const returnCycleDates = last(returns.date.createReturnCycles())
  // create a future date and pass it to the fixture loader as reference for use in yaml objects
  const refDates = {
    name: '$returnDates',
    obj: {
      dueDate: moment().add(3, 'month').format('YYYY-MM-DD'),
      endDate: moment(returnCycleDates.endDate).subtract(3, 'month').format('YYYY-MM-DD'),
      startDate: moment(returnCycleDates.startDate).add(1, 'month').format('YYYY-MM-DD'),
      refId: `v1:1:AT/CURR/MONTHLY/02:9999992:${moment(returnCycleDates.startDate).add(1, 'month').format('YYYY-MM-DD')}:${moment(returnCycleDates.endDate).subtract(3, 'month').format('YYYY-MM-DD')}`
    }
  }

  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter()
  asyncAdapter
    .add('Return', createConnector('returns'))
    .add('Version', createConnector('versions'))
    .add('Line', createConnector('lines'))
  return new FixtureLoader(asyncAdapter, dir, refDates)
}

module.exports = create
