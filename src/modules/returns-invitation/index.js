/**
 * PG boss subscribers for notifications
 */
const { enqueueMessages } = require('./lib/tasks');
const { logger } = require('@envage/water-abstraction-helpers');

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
          err.context = { component: 'src/modules/returns-invitation/index.js' };
          err.params = { job };
          logger.error('Failed to enqueue', err);
          return done(err);
        }

        return done();
      });
    }
  };
};
