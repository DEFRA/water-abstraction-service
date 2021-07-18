const controller = require('./controller');
const Joi = require('joi');

const OPTIONAL_STRING = Joi.string().allow('', null).optional();

module.exports = {
  postContact: {
    path: '/water/1.0/contacts',
    method: 'POST',
    handler: controller.postContact,
    config: {
      description: 'Proxy for CRM to create a contact entity',
      validate: {
        payload: Joi.object().keys({
          type: Joi.string().required().valid('person', 'department'),
          salutation: OPTIONAL_STRING,
          firstName: OPTIONAL_STRING,
          lastName: OPTIONAL_STRING,
          middleInitials: OPTIONAL_STRING,
          department: OPTIONAL_STRING,
          suffix: OPTIONAL_STRING,
          isTest: Joi.boolean().optional().default(false),
          source: Joi.string().valid('wrls', 'nald').default('wrls')
        }),
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        }
      }
    }
  }
};
