const contactsService = require('../../lib/services/contacts-service');
const contactMapper = require('../../lib/mappers/contact');
const helpers = require('./lib/helpers');

const postContact = async (request, h) => {
  const { email } = request.defra.internalCallingUser;
  const contact = await contactsService.createContact(contactMapper.uiToModel(request.payload));

  await helpers.createContactEvent({
    issuer: email,
    contact
  });

  return contact;
};

exports.postContact = postContact;
