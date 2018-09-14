const Boom = require('boom');
const Joi = require('joi');
const controller = require('./controller');

const isoDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const allowedPeriods = ['year', 'month', 'week', 'day'];
const readingTypes = ['estimated', 'measured'];
const statuses = ['due', 'completed', 'received'];
const units = ['m³', 'l', 'Ml', 'gal'];
const userTypes = ['internal', 'external'];

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      description: 'Gets a single view of a return for presentation to UI layer',
      validate: {
        query: {
          returnId: Joi.string().required(),
          versionNumber: Joi.number().optional().min(1)
        }
      }
    }

  },

  postReturn: {
    path: '/water/1.0/returns',
    method: 'POST',
    handler: controller.postReturn,
    config: {
      description: 'Accepts posted return data from UI layer',
      validate: {
        failAction: async (request, h, err) => {
          console.error('ValidationError:', err.message); // Better to use an actual logger here.
          throw Boom.badRequest(`Invalid request payload input`);
        },
        payload: {
          returnId: Joi.string().required(),
          licenceNumber: Joi.string().required(),
          receivedDate: Joi.string().regex(isoDateRegex).allow(null).required(),
          startDate: Joi.string().regex(isoDateRegex).required(),
          endDate: Joi.string().regex(isoDateRegex).required(),
          frequency: Joi.string().valid(allowedPeriods).required(),
          isNil: Joi.boolean().required(),
          status: Joi.string().valid(statuses).required(),
          versionNumber: Joi.number().required().min(1),
          isCurrent: Joi.boolean().required().allow(null),
          reading: Joi.when('isNil', { is: false,
            then:
            {
              type: Joi.string().valid(readingTypes).required(),
              method: Joi.string().allow(null),
              units: Joi.string().valid(units),
              totalFlag: Joi.boolean().required(),
              total: Joi.when('totalFlag', { is: true, then: Joi.number().required() })
            }
          }),
          requiredLines: Joi.array().allow(null).optional(),
          lines: Joi.when('isNil', { is: false,
            then:
            Joi.array().required().items({
              unit: Joi.string().valid(units).optional(),
              userUnit: Joi.string().valid(units).optional(),
              startDate: Joi.string().regex(isoDateRegex).required(),
              endDate: Joi.string().regex(isoDateRegex).required(),
              timePeriod: Joi.string().valid(allowedPeriods).required(),
              quantity: Joi.number().allow(null).required(),
              readingType: Joi.string().valid(readingTypes)
            })
          }),
          metadata: Joi.object(),
          user: {
            email: Joi.string().required(),
            type: Joi.string().valid(userTypes).required(),
            entityId: Joi.string().guid().required()
          }
        }
      }
    }

  }

};
