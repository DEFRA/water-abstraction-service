const { load } = require('./src/modules/import/load');
const { getNextImportBatch } = require('./src/modules/import/lib/import-log');

const checkImportQueue = async () => {
  console.log('Import: check queue');

  try {
    const data = await getNextImportBatch(100);

    for (let row of data) {
      await load(row.licence_ref);
    }
  } catch (error) {
    console.error(error);
  }

  console.log(`Import: waiting 10 seconds`);
  setTimeout(checkImportQueue, 10000);
};

checkImportQueue();
