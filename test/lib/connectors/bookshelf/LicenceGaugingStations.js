'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const LicenceGaugingStations = require('../../../../src/lib/connectors/bookshelf/LicenceGaugingStations');

experiment('lib/connectors/bookshelf/LicenceGaugingStations.js', () => {
  let instance;

  beforeEach(async () => {
    instance = LicenceGaugingStations.forge();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('uses the water.licence_gauging_stations table', async () => {
    expect(instance.tableName).to.equal('water.licence_gauging_stations');
  });

  test('uses the correct ID attribute', async () => {
    expect(instance.idAttribute).to.equal('licence_gauging_station_id');
  });

  test('configures timestamps', async () => {
    expect(instance.hasTimestamps).to.equal(['date_created', 'date_updated']);
  });
});
