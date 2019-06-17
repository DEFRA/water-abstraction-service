const messageQueue = require('../../../lib/message-queue');
const notify = require('../../../modules/notify');

const sendMessage = config => {
  return notify(messageQueue).enqueue(config);
};

exports.sendMessage = sendMessage;
