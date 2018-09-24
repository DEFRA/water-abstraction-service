const messageQueue = require('../../lib/message-queue');
const { enqueue } = require('../notify')(messageQueue);
const { prepareMessageData } = require('./lib/send');

const registerSendSubscriber = (messageQueue) => {
  return messageQueue.subscribe('returnsNotification.send', async (job, done) => {
    try {
      const options = await prepareMessageData(job.data);
      await enqueue(options);
      return done();
    } catch (err) {
      console.error(err);
      return done(err);
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
