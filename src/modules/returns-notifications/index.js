const { send } = require('./lib/send');

const registerSendSubscriber = (messageQueue) => {
  return messageQueue.subscribe('returnsNotification.send', async (job, done) => {
    try {
      await send(job.data);
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
