const Slack = require('../../lib/slack');

const { prepare, download, extract, buildSQL, importCSVToDatabase } = require('./extract');
const { loadScheduler } = require('./load-scheduler.js');
const { load } = require('./load.js');

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
        await messageQueue.publish(nextEvent);
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
      console.log(`Scheduling load`);
      await loadScheduler(messageQueue);
      console.log(`Loading scheduled`);
      done();
    } catch (err) {
      console.error(err);
      console.log(`Error scheduling load`);
    }
  });
};

const createImportNald = messageQueue => {
  return async () => {
    try {
      await Slack.post(`Starting NALD data import`);
      await prepare();
      await messageQueue.publish('import.download');
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
