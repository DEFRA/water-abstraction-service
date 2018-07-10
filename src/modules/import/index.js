const Slack = require('../../lib/slack');

const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler.js');
const { load } = require('./load.js');
const { getNextImport } = require('./lib/import-log.js');
const { clearImportLog } = require('./lib/import-log');

const registerImportLicence = (messageQueue) => {
  messageQueue.subscribe('import.licence', async (job, done) => {
    const { licenceNumber } = job.data;
    try {
      console.log(`Importing ${licenceNumber}`);
      await load(licenceNumber);
    } catch (err) {
      console.error(err);
    }
    done();
  });
};

/**
 * Creates a function which can handle a licence import
 * @param {Object} messageQueue - PG Boss instance
 * @return {Function} async function to import licence
 */
const importNextLicence = (messageQueue) => {
  return async (job, done) => {
    try {
      const row = await getNextImport();
      if (row) {
        const { licence_ref: licenceNumber } = row;
        await messageQueue.publish('import.licence', { licenceNumber }, {
          singletonKey: licenceNumber,
          retryLimit: 3
        });
      } else {
        messageQueue.publish('import.complete');
      }
      done();
    } catch (err) {
      console.error(err);
      done(err);
    }
  };
};

const registerLoadScheduler = (messageQueue) => {
  messageQueue.subscribe('import.schedule', async (job, done) => {
    const { command = '-' } = job.data;
    try {
      await Slack.post(`Import: scheduling licence imports`);
      await loadScheduler(messageQueue, command);
      await Slack.post(`Import: scheduling complete`);
      done();
    } catch (err) {
      console.error(err);
    }
  });

  messageQueue.onComplete('import.schedule', importNextLicence(messageQueue));
  messageQueue.onComplete('import.licence', importNextLicence(messageQueue));
};

const createImportNald = messageQueue => {
  return async () => {
    try {
      await Slack.post(`Starting NALD data import`);
      await clearImportLog();
      await downloadAndExtract();
      await messageQueue.publish('import.schedule');
    } catch (err) {
      console.error(err);
    }
  };
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerLoadScheduler(messageQueue);
    registerImportLicence(messageQueue);
  };
};

module.exports = (messageQueue) => {
  return {
    importNald: createImportNald(messageQueue),
    registerSubscribers: createRegisterSubscribers(messageQueue)
  };
};
