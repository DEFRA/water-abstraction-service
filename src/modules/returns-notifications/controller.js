const { returns } = require('../../lib/connectors/returns');
const { findAllPages } = require('../../lib/api-client-helpers');
const eventFactory = require('./lib/event-factory');
const generateReference = require('../../lib/reference-generator');

const messageQueue = require('../../lib/message-queue');
const { getJobData } = require('./lib/message-helpers');

// const { enqueue } = require('./index.js')(messageQueue);

const postReturnNotification = async (request, h) => {
  const { notificationId } = request.params;

  // Get params to query returns service
  const { filter, issuer, name } = request.payload;
  const columns = ['return_id', 'licence_ref'];
  const sort = {};

  // Find all returns matching criteria
  const data = await findAllPages(returns, filter, sort, columns);

  // Generate a reference number
  const ref = generateReference('RETURNS-');

  // Create container event in event log for tracking/reporting of batch
  const e = eventFactory(issuer, notificationId, data, ref, name);
  await e.save();

  // Schedule building of individual messages
  for (let row of data) {
    const job = getJobData(row, e.data, notificationId);
    await messageQueue.publish('returnsNotification.send', job);
  }

  return { };
};

module.exports = {
  postReturnNotification
};
