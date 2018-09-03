const Joi = require('joi');
const controller = require('./controller');

const isoDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const allowedPeriods = ['year', 'month', 'week', 'day'];
const types = ['estimated', 'measured'];
const statuses = ['due', 'complete'];
const methods = ['amounts', 'pump', 'herd'];
const units = ['m³', 'l', 'Ml', 'gal'];

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      description: 'Gets a single view of a return for presentation to UI layer',
      validate: {
        query: {
          returnId: Joi.string().required()
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
        payload: {
          returnId: Joi.string().required(),
          licenceNumber: Joi.string().required(),
          startDate: Joi.string().regex(isoDateRegex).required(),
          endDate: Joi.string().regex(isoDateRegex).required(),
          frequency: Joi.string().valid(allowedPeriods).required(),
          isNil: Joi.boolean().required(),
          status: Joi.string().valid(statuses).required(),
          versionNumber: Joi.number().required().min(1),
          reading: {
            type: Joi.string().valid(types).required(),
            method: Joi.when('type', {is: 'estimated', then: Joi.string().valid(methods).required()}),
            pumpCapacity: Joi.when('method', { is: 'pump', then: Joi.number().required() }),
            hoursRun: Joi.when('method', { is: 'pump', then: Joi.number().required() }),
            numberLivestock: Joi.when('method', { is: 'herd', then: Joi.number().required().min(1) }),
            units: Joi.string().valid(units),
            totalFlag: Joi.boolean().required(),
            total: Joi.when('totalFlag', { is: true, then: Joi.number().required() })
          },
          requiredLines: Joi.array(),
          lines: Joi.when('isNil', { is: false,
            then:
            Joi.array().required().items({
              startDate: Joi.string().regex(isoDateRegex).required(),
              endDate: Joi.string().regex(isoDateRegex).required(),
              timePeriod: Joi.string().valid(allowedPeriods).required(),
              quantity: Joi.number().allow(null).required()
            })
          }),
          metadata: Joi.object()
        }
      }
    }

  }

};
