'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { createScheduledNotification } = require('../../../src/lib/services/scheduled-notifications');
const ScheduledNotification = require('../../../src/lib/models/scheduled-notification');
// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = () => {
  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter();

  asyncAdapter
    .add('ScheduledNotification', (body) => {
      const notification = new ScheduledNotification();
      Object.keys(body).map(key => {
        console.log(key);
        notification[key] = body[key];
        console.log(notification);
      });

      return createScheduledNotification(notification);
    });
  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
