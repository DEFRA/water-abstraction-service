const Slack = require('../../lib/slack');
const os = require('os');

const { prepare, download, extract, buildSQL, importCSVToDatabase } = require('./helpers');

const createImportNald = messageQueue => {
  return async () => {
    try {
      const hostname = os.hostname();
      await Slack.post(`Starting NALD data import on ${hostname} - ${process.env.environment} `);
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
      messageQueue.publish('import.extract');
    } catch (err) {
      console.error(err);
    }
  });
};

const registerExtractSubscriber = messageQueue => {
  messageQueue.subscribe('import.extract', async (job, done) => {
    try {
      await Slack.post('Extracting ZIP');
      await extract();
      messageQueue.publish('import.buildsql');
    } catch (err) {
      console.error(err);
    }
  });
};

const registerBuildSqlSubscriber = messageQueue => {
  messageQueue.subscribe('import.buildsql', async (job, done) => {
    try {
      await Slack.post('Building SQL');
      await buildSQL();
      messageQueue.publish('import.csv');
    } catch (err) {
      console.error(err);
    }
  });
};

const registerImportCSVSubscriber = messageQueue => {
  messageQueue.subscribe('import.csv', async (job, done) => {
    try {
      await Slack.post('Import CSV files to DB');
      await importCSVToDatabase();
    } catch (err) {
      console.error(err);
    }
  });
};

const createRegisterSubscribers = messageQueue => {
  return () => {
    registerDownloadSubscriber(messageQueue);
    registerExtractSubscriber(messageQueue);
    registerBuildSqlSubscriber(messageQueue);
    registerImportCSVSubscriber(messageQueue);
  };
};

module.exports = (messageQueue) => {
  return {
    importNald: createImportNald(messageQueue),
    registerSubscribers: createRegisterSubscribers(messageQueue)
  };
};
