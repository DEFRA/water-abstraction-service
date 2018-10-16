/**
 * PG boss subscribers for notifications
 */
const { enqueueMessages } = require('./lib/tasks');

module.exports = (messageQueue) => {
  return {
    registerSubscribers: async () => {
      /**
       * A subscriber which picks up a notification state object, and enqueues
       * each message
       */
      await messageQueue.subscribe('notification.enqueue', async (job, done) => {
        const { state } = job.data;

        try {
          await enqueueMessages(state);
        } catch (err) {
          console.error(err);
          return done(err);
        }

        return done();
      });
    }
  };
};
