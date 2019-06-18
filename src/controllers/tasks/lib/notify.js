const messageQueue = require('../../../lib/message-queue');
const notify = require('../../../modules/notify');

const _notify = notify(messageQueue);

const sendMessage = config => {
  return _notify.enqueue(config);
};

exports.sendMessage = sendMessage;
exports._notify = _notify;
