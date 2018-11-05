const { load } = require('./src/modules/import/load');
const { getNextImportBatch } = require('./src/modules/import/lib/import-log');
const logger = require('./src/lib/logger');

process.on('uncaughtException', (err) => {
  logger.error(err);
});

const checkImportQueue = async () => {
  logger.info('Import: check queue');

  try {
    const data = await getNextImportBatch(100);

    logger.info(`Import: ${data.length} items to import. ${(new Date()).toISOString()}`);

    for (let row of data) {
      await load(row.licence_ref);
    }
  } catch (error) {
    logger.error(error);
  }

  logger.info(`Import: waiting 10 seconds`);
  setTimeout(checkImportQueue, 10000);
};

checkImportQueue();
