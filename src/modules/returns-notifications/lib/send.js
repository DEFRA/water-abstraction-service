const Boom = require('boom');
const { get } = require('lodash');

const { returns } = require('../../../lib/connectors/returns');
const contactList = require('../../../lib/contact-list');

const { getRequiredLines } = require('../../returns/lib/model-returns-mapper');

/**
 * Gets contacts
 * @param {String} licenceNumber
 * @return {Promise} resolves with array of contacts
 */
const getContact = (licenceNumber) => {
  return contactList({ system_external_id: licenceNumber }, ['returns_contact', 'licence_holder']);
};

/**
 * Contains code to pick up details of a return notification to be sent,
 * and retrieves relevant contacts and returns information in order to enqueue
 * it with notify module
 */
const send = async (data) => {
  const { returnId, licenceNumber, eventId } = data;

  const [contactData] = await getContact(licenceNumber);

  const { error, data: [ret] } = await returns.findMany({return_id: returnId});

  if (error) {
    throw Boom.badImplementation(`Error fetching return ${returnId}`, error);
  }

  if (!ret) {
    throw Boom.notFound(`Return ${returnId} not found`);
  }

  const requiredLines = getRequiredLines(ret.start_date, ret.end_date, ret.returns_frequency);

  const personalisation = {
    ...contactData.contact,
    formatId: get(ret, 'metadata.nald.formatId'),
    qrUrl: `${process.env.base_url}?returnId=${returnId}`,
    requiredLines
  };

  console.log(personalisation);

  // console.log('Return send!');
  // console.log(contactData);
  // console.log(ret);
};

module.exports = {
  send
};
