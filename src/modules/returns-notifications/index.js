const messageQueue = require('../../lib/message-queue');
const { enqueue } = require('../notify')(messageQueue);
const { prepareMessageData } = require('./lib/send');
const { logger } = require('../../logger');

const registerSendSubscriber = (messageQueue) => {
  return messageQueue.subscribe('returnsNotification.send', async (job) => {
    try {
      const options = await prepareMessageData(job.data);
      await enqueue(options);
      return job.done();
    } catch (err) {
      logger.error('Failed to enqueue return notification', err);
      return job.done(err);
    }
  });
};

const createRegisterSubscribers = messageQueue => {
  return async () => {
    await registerSendSubscriber(messageQueue);
  };
};

module.exports = (messageQueue) => {
  const registerSubscribers = createRegisterSubscribers(messageQueue);

  return {
    registerSubscribers
  };
};
