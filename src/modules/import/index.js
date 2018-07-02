const Slack = require('../../lib/slack');

const { prepare, download, extract, buildSQL, importCSVToDatabase } = require('./helpers');
const { scheduleImports } = require('./import-scheduler.js');
const { importLicence } = require('./import.js');

/**
 * Register event handler with message queue
 * @param {Object} messageQueue - the PG boss instance
 * @param {String} eventName - the PG boss event name
 * @param {Function} handler - async function to call
 * @param {String} [nextEvent] - the PG boss event name to publish when complete
 */
const registerSubscriberWithSlackReport = (messageQueue, eventName, handler, nextEvent) => {
  messageQueue.subscribe(eventName, async (job, done) => {
    try {
      Slack.post('Starting: ' + eventName);
      await handler();
      Slack.post('Success: ' + eventName);
      if (nextEvent) {
        messageQueue.publish(nextEvent);
      }
    } catch (err) {
      console.error(err);
      Slack.post('Error: ' + eventName);
    }
    done();
  });
};

const registerImportLicence = (messageQueue) => {
  messageQueue.subscribe('import.licence', async (job, done) => {
    const {licenceNumber, index, licenceCount} = job.data;
    try {
      console.log(`Importing ${licenceNumber} (${index} of ${licenceCount})`);
      await importLicence(licenceNumber);
    } catch (err) {
      console.error(err);
    }
    done();
  });
};

const registerImportScheduler = (messageQueue) => {
  messageQueue.subscribe('import.schedule', async (job, done) => {
    try {
      console.log(`Scheduling imports`);
      await scheduleImports(messageQueue);
      console.log(`Imports scheduled`);
      done();
    } catch (err) {
      console.error(err);
      console.log(`Error scheduling imports`);
    }
  });
};

const createImportNald = messageQueue => {
  return async () => {
    try {
      await Slack.post(`Starting NALD data import`);
      await prepare();
      messageQueue.publish('import.download');
    } catch (err) {
      console.error(err);
    }
  };
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerSubscriberWithSlackReport(messageQueue, 'import.download', download, 'import.extract');
    registerSubscriberWithSlackReport(messageQueue, 'import.extract', extract, 'import.buildsql');
    registerSubscriberWithSlackReport(messageQueue, 'import.buildsql', buildSQL, 'import.csv');
    registerSubscriberWithSlackReport(messageQueue, 'import.csv', importCSVToDatabase, 'import.schedule');

    registerImportScheduler(messageQueue);
    registerImportLicence(messageQueue);
  };
};

module.exports = (messageQueue) => {
  return {
    importNald: createImportNald(messageQueue),
    registerSubscribers: createRegisterSubscribers(messageQueue)
  };
};
