const Boom = require('boom');

const returns = require('../../../lib/connectors/returns');
const contactList = require('../../../lib/contact-list');

const { formatEnqueueOptions } = require('./message-helpers');

/**
 * Gets contacts
 * @param {String} licenceNumber
 * @return {Promise} resolves with array of contacts
 */
const getContact = (licenceNumber) => {
  return contactList.contactList({ system_external_id: licenceNumber }, ['returns_contact', 'licence_holder']);
};

/**
 * Contains code to pick up details of a return notification to be sent,
 * and retrieves relevant contacts and returns information in order to enqueue
 * it with notify module
 * @param {Object} data - job data from PG boss message queue
 * @param {String} data.returnId
 * @param {String} data.licenceNumber
 * @param {String} data.eventId - batch event ID from the events table
 * @param {String} data.messageRef - corresponds to message type / template used
 * @return {Promise} resolves when message queued with PG boss
 */
const prepareMessageData = async (data) => {
  const { returnId, licenceNumber, eventId, messageRef } = data;

  const [contactData] = await getContact(licenceNumber);

  const { error, data: [ret] } = await returns.returns.findMany({return_id: returnId});

  if (error) {
    throw Boom.badImplementation(`Error fetching return ${returnId}`, error);
  }

  if (!ret) {
    throw Boom.notFound(`Return ${returnId} not found`);
  }

  return formatEnqueueOptions({ eventId, messageRef }, ret, contactData);
};

module.exports = {
  prepareMessageData
};
