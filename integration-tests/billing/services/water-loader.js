'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { createScheduledNotification } = require('../../../src/lib/services/scheduled-notifications');
const ScheduledNotification = require('../../../src/lib/models/scheduled-notification');
const licencesConnector = require('../../../src/lib/connectors/repos/licences');
const regionsConnector = require('../../../src/lib/connectors/repos/regions');

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = () => {
  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter();

  asyncAdapter
    .add('ScheduledNotification', async (body) => {
      const notification = new ScheduledNotification();
      Object.keys(body).map(key => {
        notification[key] = body[key];
      });

      return createScheduledNotification(notification);
    })
    .add('Licence', async (body) => {
      const regions = await regionsConnector.find();
      return licencesConnector.create(
        body.licenceRef,
        regions.find(x => x.naldRegionId === 6).regionId,
        new Date().toJSON().slice(0, 10),
        null, {
          historicalAreaCode: 'SAAR',
          regionalChargeArea: 'Southern'
        },
        true,
        true);
    });
  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
