const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const config = require('../../../../config');
const sinon = require('sinon');
const moment = require('moment');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const syncGaugingStationsJob = require('../../../../src/modules/gauging-stations/jobs/sync-gauging-stations');

experiment('.createMessage', () => {
  let message;

  beforeEach(async () => {
    message = syncGaugingStationsJob.createMessage();
  });

  test('creates a message with the expected name', async () => {
    expect(message[0]).to.equal('gauging-stations.sync-from-csv');
  });

  test('the message has no associated job data', async () => {
    expect(message[1]).to.equal({});
  });

  test('the message has a config object calling for repeats', async () => {
    expect(message[2]).to.equal({
      jobId: `gauging-stations.sync-from-csv.${moment().format('YYYYMMDD')}`,
      repeat: {
        every: config.import.gaugingStationsSyncFrequencyInMS
      }
    });
  });
});
