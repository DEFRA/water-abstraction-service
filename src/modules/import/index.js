const Slack = require('../../lib/slack');
const { clearImportLog } = require('./lib/import-log');
const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler');
const { logger } = require('../../logger');

const scheduleImportSubscriber = async job => {
  Slack.post('Import: scheduling licence imports');
  try {
    await loadScheduler();
    Slack.post('Import: scheduling complete');
  } catch (err) {
    logger.error('Schedule licence import error', err, { job });
    throw err;
  }
};

const startImportSubscriber = async job => {
  try {
    Slack.post('Starting NALD data import');
    await clearImportLog();
    await downloadAndExtract();
  } catch (err) {
    logger.error('Nald data import start error', err, { job });
    throw err;
  }
};

module.exports = (messageQueue) => {
  return {
    importNald: () => {
      messageQueue.publish('import.start', {}, {
        expireIn: '1 hours',
        singletonKey: 'defra-nald-import'
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
