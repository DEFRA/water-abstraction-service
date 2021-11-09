const { uniq } = require('lodash');
const evt = require('../../lib/event');
const { returns } = require('../../lib/connectors/returns');
const permitConnector = require('../../lib/connectors/permit');
const eventFactory = require('./lib/event-factory');
const generateReference = require('../../lib/reference-generator');
const returnsNotificationSend = require('./lib/returns-notification-send');
const { getJobData } = require('./lib/message-helpers');
const { parseRequest } = require('./lib/request-parser');

/**
 * Previews what will be send by the returns notification, by using the
 * same filter query used by the post call below
 */
const postPreviewReturnNotification = async (request, h) => {
  const { filter, columns, sort } = parseRequest(request);

  // Find all returns matching criteria
  const data = await returns.findAll(filter, sort, columns);

  const licenceRefs = uniq(data.map(item => item.licence_ref));

  const licencesEndDates = await permitConnector.getLicenceEndDates(licenceRefs);

  return {
    error: null,
    data: data.map(item => {
      const endDates = licencesEndDates[item.licence_ref];
      return Object.assign(item, endDates);
    })
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
    sort,
    config
  } = parseRequest(request);

  // Find all returns matching criteria
  const data = await returns.findAll(filter, sort, columns);

  // Generate a reference number
  const ref = generateReference(config.prefix);

  // Create container event in event log for tracking/reporting of batch
  const e = eventFactory({
    issuer,
    messageRef,
    ref,
    name
  }, data);

  await evt.save(e);

  // Schedule building of individual messages
  for (const row of data) {
    const job = getJobData(row, e, messageRef, config);
    request.queueManager.add(returnsNotificationSend.jobName, job);
  }

  return { event: e.data };
};

module.exports = {
  postPreviewReturnNotification,
  postReturnNotification
};
