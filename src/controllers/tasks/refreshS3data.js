const messageQueue = require('../../lib/message-queue');
const { importNald } = require('../../modules/import')(messageQueue);

const run = async (data) => {
  try {
    await importNald();
    return { error: null };
  } catch (error) {
    return {error};
  }
};

module.exports = {
  run
};
