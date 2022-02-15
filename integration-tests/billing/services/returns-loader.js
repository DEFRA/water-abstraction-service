'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { returns, serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createReturnsUrl = (...parts) => urlJoin(config.services.returns, ...parts);
const moment = require('moment');

// Resolve path to fixtures directory
const path = require('path');
const { last } = require('lodash');
const dir = path.resolve(__dirname, '../fixtures');

const createConnector = tail => async body => {
  const { data } = await serviceRequest.post(createReturnsUrl(tail), { body });
  return data;
};

const create = () => {
  const returnCycleDates = last(returns.date.createReturnCycles(undefined, undefined));
  // create a future date and pass it to the fixture loader as reference for use in yaml objects
  const refDates = {
    name: '$returnDates',
    obj: {
      dueDateSummerFalse: moment(returnCycleDates.dueDate).add(1, 'month').format('YYYY-MM-DD'),
      endDateSummerFalse: moment(returnCycleDates.endDate).subtract(1, 'month').format('YYYY-MM-DD'),
      startDateSummerFalse: moment(returnCycleDates.startDate).add(1, 'month').format('YYYY-MM-DD'),
      refIdSummerFalse: `v1:1:AT/CURR/MONTHLY/02:9999992:${moment(returnCycleDates.startDate).add(1, 'month').format('YYYY-MM-DD')}:${moment(returnCycleDates.endDate).subtract(1, 'month').format('YYYY-MM-DD')}`,
      dueDateSummerTrue: moment(returnCycleDates.dueDate).add(2, 'month').format('YYYY-MM-DD'),
      endDateSummerTrue: moment(returnCycleDates.endDate).subtract(2, 'month').format('YYYY-MM-DD'),
      startDateSummerTrue: moment(returnCycleDates.startDate).add(2, 'month').format('YYYY-MM-DD'),
      refIdSummerTrue: `v1:1:AT/CURR/MONTHLY/02:9999992:${moment(returnCycleDates.startDate).add(2, 'month').format('YYYY-MM-DD')}:${moment(returnCycleDates.endDate).subtract(2, 'month').format('YYYY-MM-DD')}`
    }
  };

  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter();
  asyncAdapter
    .add('Return', createConnector('returns'))
    .add('Version', createConnector('versions'))
    .add('Line', createConnector('lines'));
  return new FixtureLoader(asyncAdapter, dir, refDates);
};

module.exports = create;
