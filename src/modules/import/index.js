const Slack = require('../../lib/slack');
const { clearImportLog } = require('./lib/import-log');
const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler');
const logger = require('../../lib/logger');

const scheduleImportSubscriber = async (job, done) => {
  Slack.post(`Import: scheduling licence imports`);
  try {
    await loadScheduler();
    Slack.post(`Import: scheduling complete`);
    done();
  } catch (err) {
    err.params = { job };
    logger.error('Schedule licence import error', err);
  }
};

const startImportSubscriber = async (job, done) => {
  try {
    Slack.post(`Starting NALD data import`);
    await clearImportLog();
    await downloadAndExtract();
    done();
  } catch (err) {
    err.params = { job };
    logger.error('Nald data import start error', err);
    done(err);
  }
};

module.exports = (messageQueue) => {
  return {
    importNald: () => {
      messageQueue.publish('import.start', {}, {
        expireIn: '1 hours'
      });
    },
    registerSubscribers: async () => {
      // Register event subscribers
      await messageQueue.subscribe('import.start', startImportSubscriber);
      await messageQueue.subscribe('import.schedule', scheduleImportSubscriber);

      // Register state-based subscribers
      messageQueue.onComplete('import.start', () => {
        messageQueue.publish('import.schedule');
      });
    }
  };
};
