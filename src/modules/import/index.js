const Slack = require('../../lib/slack');

const { prepare, download, extract, buildSQL, importCSVToDatabase } = require('./helpers');
const { scheduleImports } = require('./import-scheduler.js');
const { importLicence } = require('./import.js');
const { updateImportLog } = require('./import-log.js');

const registerImportLicence = (messageQueue) => {
  messageQueue.subscribe('import.licence', async (job, done) => {
    const {licenceNumber, index, licenceCount} = job.data;
    try {
      console.log(`Importing ${licenceNumber} (${index} of ${licenceCount})`);
      await importLicence(licenceNumber);
      await updateImportLog(licenceNumber, 'OK');
    } catch (err) {
      console.error(err);
      await updateImportLog(licenceNumber, err.toString());
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

const registerDownloadSubscriber = messageQueue => {
  messageQueue.subscribe('import.download', async (job, done) => {
    try {
      await Slack.post('Downloading from S3');
      await download();
      await Slack.post('Downloaded');
      messageQueue.publish('import.extract');
      done();
    } catch (err) {
      console.error(err);
      await Slack.post('Error downloading from S3');
    }
  });
};

const registerExtractSubscriber = messageQueue => {
  messageQueue.subscribe('import.extract', async (job, done) => {
    try {
      await Slack.post('Extracting ZIP');
      await extract();
      await Slack.post('ZIP extracted');
      messageQueue.publish('import.buildsql');
    } catch (err) {
      console.error(err);
      await Slack.post('Error extracting ZIP');
    }
  });
};

const registerBuildSqlSubscriber = messageQueue => {
  messageQueue.subscribe('import.buildsql', async (job, done) => {
    try {
      await Slack.post('Building SQL');
      await buildSQL();
      await Slack.post('SQL built');
      messageQueue.publish('import.csv');
    } catch (err) {
      console.error(err);
      await Slack.post('Error building SQL');
    }
  });
};

const registerImportCSVSubscriber = messageQueue => {
  messageQueue.subscribe('import.csv', async (job, done) => {
    try {
      await Slack.post('Import CSV files to DB');
      await importCSVToDatabase();
      await Slack.post('Imported CSV files to DB');
      messageQueue.publish('import.schedule');
    } catch (err) {
      console.error(err);
      await Slack.post('Error importing CSV files to DB');
    }
  });
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerDownloadSubscriber(messageQueue);
    registerExtractSubscriber(messageQueue);
    registerBuildSqlSubscriber(messageQueue);
    registerImportCSVSubscriber(messageQueue);
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
