const contactsService = require('../../lib/services/contacts-service');
const contactMapper = require('../../lib/mappers/contact');
const helpers = require('./lib/helpers');

const getContact = (request, h) => contactsService.getContact(request.params.contactId);

const postContact = async (request, h) => {
  const { email } = request.defra.internalCallingUser;
  const contact = await contactsService.createContact(contactMapper.uiToModel(request.payload));

  await helpers.createContactEvent({
    issuer: email,
    contact
  });

  return contact;
};

const patchContact = (request, h) => {
  const { contactId } = request.params;

  return contactsService.patchContact(contactId, request.payload);
};

exports.getContact = getContact;
exports.postContact = postContact;
exports.patchContact = patchContact;
