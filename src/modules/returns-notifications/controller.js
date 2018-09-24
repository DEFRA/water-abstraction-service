const { returns } = require('../../lib/connectors/returns');
const { findAllPages } = require('../../lib/api-client-helpers');
const eventFactory = require('./lib/event-factory');
const generateReference = require('../../lib/reference-generator');

const messageQueue = require('../../lib/message-queue');
const { getJobData } = require('./lib/message-helpers');

/**
 * This route handler accepts a POST request containing a filter to find
 * the relevant returns.
 * It then schedules a message on the message queue for each message
 * containing minimal information (return ID, licence number)
 * This is picked up and more details are collected about the return
 * before it is enqueue()'d with the Notify code module
 * @param {Object} request.payload.filter - filter for retrieving returns from returns module
 * @param {String} request.payload.issuer - email address of user issuing notification
 * @param {String} name - name of reminder, eg  'invitation', 'reminder', 'paper form'
 */
const postReturnNotification = async (request, h) => {
  const { notificationId: messageRef } = request.params;

  // Get params to query returns service
  const { filter, issuer, name } = request.payload;
  const columns = ['return_id', 'licence_ref'];
  const sort = {};

  // Find all returns matching criteria
  const data = await findAllPages(returns, filter, sort, columns);

  // Generate a reference number
  const ref = generateReference('RETURNS-');

  // Create container event in event log for tracking/reporting of batch
  const e = eventFactory({
    messageRef,
    issuer,
    ref,
    name
  }, data);

  await e.save();

  // Schedule building of individual messages
  for (let row of data) {
    const job = getJobData(row, e.data, messageRef);
    await messageQueue.publish('returnsNotification.send', job);
  }

  return { };
};

module.exports = {
  postReturnNotification
};
