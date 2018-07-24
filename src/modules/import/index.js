const Slack = require('../../lib/slack');

const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler.js');
const { load } = require('./load.js');
const { getNextImportBatch } = require('./lib/import-log.js');
const { clearImportLog } = require('./lib/import-log');

const importLicenceBatchSubscriber = async (job, done) => {
  try {
    const { licenceNumbers } = job.data;
    await load(licenceNumbers);
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
const importNextLicenceBatch = (messageQueue) => {
  return async () => {
    try {
      const rows = await getNextImportBatch();

      if (rows.length) {
        const licenceNumbers = rows.map(row => row.licence_ref);

        await messageQueue.publish('import.licences', { licenceNumbers }, {
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
      await messageQueue.subscribe('import.licences', importLicenceBatchSubscriber);

      // Register state-based subscribers
      messageQueue.onComplete('import.start', () => {
        messageQueue.publish('import.schedule');
      });

      const importBatch = importNextLicenceBatch(messageQueue);

      messageQueue.onComplete('import.schedule', importBatch);
      messageQueue.onComplete('import.licences', importBatch);
      messageQueue.onFail('import.licences', importBatch);

      // messageQueue.publish('import.schedule');

      // Import next licence in queue on startup
      importBatch();
    }
  };
};
