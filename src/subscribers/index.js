const notifyHandlers = require('./notify');

module.exports = (messageQueue) => {
  notifyHandlers(messageQueue);
};
