const { returns } = require('../../lib/connectors/returns');
const { findAllPages } = require('../../lib/api-client-helpers');
const eventFactory = require('./lib/event-factory');
const generateReference = require('../../lib/reference-generator');

const messageQueue = require('../../lib/message-queue');
const { getJobData } = require('./lib/message-helpers');
const { parseRequest } = require('./lib/request-parser');

/**
 * Previews what will be send by the returns notification, by using the
 * same filter query used by the post call below
 */
const postPreviewReturnNotification = async (request, h) => {
  const {
    filter,
    columns,
    sort
  } = parseRequest(request);

  // Find all returns matching criteria
  const data = await findAllPages(returns, filter, sort, columns);

  return {
    error: null,
    data
  };
};

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
  const {
    messageRef,
    filter,
    issuer,
    name,
    columns,
    sort
  } = parseRequest(request);

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
  postPreviewReturnNotification,
  postReturnNotification
};
