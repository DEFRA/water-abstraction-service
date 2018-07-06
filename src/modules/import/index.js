const Slack = require('../../lib/slack');

const { downloadAndExtract } = require('./extract');
const { loadScheduler } = require('./load-scheduler.js');
const { load } = require('./load.js');

const registerImportLicence = (messageQueue) => {
  messageQueue.subscribe('import.licence', async (job, done) => {
    const {licenceNumber, index, licenceCount} = job.data;
    try {
      console.log(`Importing ${licenceNumber} (${index} of ${licenceCount})`);
      await load(licenceNumber);
    } catch (err) {
      console.error(err);
    }
    done();
  });
};

const registerLoadScheduler = (messageQueue) => {
  messageQueue.subscribe('import.schedule', async (job, done) => {
    try {
      await Slack.post(`Import: scheduling licence imports`);
      await loadScheduler(messageQueue);
      await Slack.post(`Import: scheduling complete`);
      done();
    } catch (err) {
      console.error(err);
    }
  });
};

const createImportNald = messageQueue => {
  return async () => {
    try {
      await Slack.post(`Starting NALD data import`);
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
