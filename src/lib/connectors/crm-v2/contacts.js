'use strict';

const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

/**
 * Get a single contact
 * @param {String} contactId The uuid of the contact to retrieve
 */
const getContact = contactId => {
  const uri = urlJoin(config.services.crm_v2, 'contacts', contactId);
  return serviceRequest.get(uri);
};

/**
 * Gets the contacts for the given contact ids
 * @param {Array<String>} contactIds The array of contact id uuids to fetch
 */
const getContacts = contactIds => {
  const uri = urlJoin(config.services.crm_v2, 'contacts');
  return serviceRequest.get(uri, {
    qs: {
      ids: contactIds.join(',')
    }
  });
};

exports.getContact = getContact;
exports.getContacts = getContacts;
