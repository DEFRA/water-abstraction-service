const controller = require('./controller')
const Joi = require('joi')

const OPTIONAL_STRING = Joi.string().allow('', null).optional()
const OPTIONAL_EMAIL = Joi.string().email().allow('', null).optional()

module.exports = {
  getContact: {
    path: '/water/1.0/contact/{contactId}',
    method: 'GET',
    handler: controller.getContact,
    config: {
      validate: {
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required())
        },
        params: Joi.object().keys({
          contactId: Joi.string().guid().required()
        })
      }
    }
  },

  patchContact: {
    path: '/water/1.0/contact/{contactId}',
    method: 'PATCH',
    handler: controller.patchContact,
    config: {
      validate: {
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required())
        },
        params: Joi.object().keys({
          contactId: Joi.string().guid().required()
        }),
        payload: Joi.object().keys({
          salutation: Joi.string().optional().allow(null),
          email: Joi.string().email().optional(),
          firstName: Joi.string().optional().allow(null),
          lastName: Joi.string().optional().allow(null),
          department: Joi.string().optional().allow(null),
          middleInitials: Joi.string().optional().allow(null),
          suffix: Joi.string().optional().allow(null)
        })
      }
    }
  },

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
          email: OPTIONAL_EMAIL,
          suffix: OPTIONAL_STRING,
          isTest: Joi.boolean().optional().default(false),
          source: Joi.string().valid('wrls', 'nald').default('wrls')
        }),
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required())
        }
      }
    }
  }
}
