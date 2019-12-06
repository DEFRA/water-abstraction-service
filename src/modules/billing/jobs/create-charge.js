const { logger } = require('../../../logger');

const JOB_NAME = 'billing.create-charge';

/**
 * Creates an object ready to publish on the message queue
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 * @param {Object} transaction The transaction to create
 */
const createMessage = (eventId, batch, transaction) => ({
  name: JOB_NAME,
  data: { eventId, batch, transaction }
});

const handleCreateCharge = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  /**
   * Placeholder
   *
   * get the transaction
   *
   * create a transaction in the charge module
   *
   * update the external id, and the status in the
   * water.billing_transactions table
   */
  return {
    batch: job.data.batch
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleCreateCharge;
