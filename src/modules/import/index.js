const Slack = require('../../lib/slack');

const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler.js');
const { load } = require('./load.js');
const { getNextImport } = require('./lib/import-log.js');
const { clearImportLog } = require('./lib/import-log');

const importLicenceSubscriber = async (job, done) => {
  try {
    const { licenceNumber } = job.data;
    console.log(`Importing ${licenceNumber}`);
    await load(licenceNumber);
    done();
  } catch (err) {
    console.error(err);
    done(err);
  }
};

const scheduleImportSubscriber = async (job, done) => {
  await Slack.post(`Import: scheduling licence imports`);
  try {
    await loadScheduler();
    await Slack.post(`Import: scheduling complete`);
    done();
  } catch (err) {
    console.error(err);
  }
};

/**
 * Creates a function which can handle a licence import
 * @param {Object} messageQueue - PG Boss instance
 * @return {Function} async function to import licence
 */
const importNextLicence = (messageQueue) => {
  return async () => {
    try {
      const row = await getNextImport();
      if (row) {
        const { licence_ref: licenceNumber } = row;
        await messageQueue.publish('import.licence', { licenceNumber }, {
          retryLimit: 3
        });
      } else {
        messageQueue.publish('import.complete');
      }
    } catch (err) {
      console.error(err);
    }
  };
};

const startImportSubscriber = async (job, done) => {
  try {
    await Slack.post(`Starting NALD data import`);
    await clearImportLog();
    await downloadAndExtract();
    done();
  } catch (err) {
    console.error(err);
    done(err);
  }
};

module.exports = (messageQueue) => {
  return {
    importNald: () => {
      messageQueue.publish('import.start');
    },
    registerSubscribers: async () => {
      // Register event subscribers
      await messageQueue.subscribe('import.start', startImportSubscriber);
      await messageQueue.subscribe('import.schedule', scheduleImportSubscriber);
      await messageQueue.subscribe('import.licence', importLicenceSubscriber);

      // Register state-based subscribers
      messageQueue.onComplete('import.start', () => {
        messageQueue.publish('import.schedule');
      });
      messageQueue.onComplete('import.schedule', importNextLicence(messageQueue));
      messageQueue.onComplete('import.licence', importNextLicence(messageQueue));
      messageQueue.onFail('import.licence', importNextLicence(messageQueue));

      // Import next licence in queue on startup
      importNextLicence(messageQueue)();
    }
  };
};
