const Joi = require('joi');
const isoDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const allowedPeriods = ['year', 'month', 'week', 'day'];
const readingTypes = ['estimated', 'measured'];
const statuses = ['due', 'completed', 'received'];
const units = ['m³', 'l', 'Ml', 'gal'];
const userTypes = ['internal', 'external'];
const returnIDRegex = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const formatIDRegex = /^[0-9]+$/;

const userSchema = Joi.object().required().keys({
  email: Joi.string().required(),
  type: Joi.string().valid(userTypes).required(),
  entityId: Joi.string().guid().required()
});

/**
 * Schema for return lines, either via single/multiple flow
 * @type {Object}
 */
const lines = Joi.when('isNil', {
  is: false,
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
});

/**
 * Schema for return
 * @type {Object}
 */
const returnSchema = {
  returnId: Joi.string().regex(returnIDRegex).required(),
  licenceNumber: Joi.string().required(),
  receivedDate: Joi.string().regex(isoDateRegex).allow(null).required(),
  startDate: Joi.string().regex(isoDateRegex).required(),
  endDate: Joi.string().regex(isoDateRegex).required(),
  dueDate: Joi.string().regex(isoDateRegex).required(),
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
  meters: Joi.when('isNil', { is: false,
    then: Joi.when('reading.method', { is: 'abstractionVolumes',
      then: Joi.array().items({
        manufacturer: Joi.string().required(),
        serialNumber: Joi.string().required(),
        multiplier: Joi.number().valid(1, 10).required()
      }),
      else: Joi.array().items({
        manufacturer: Joi.string().required(),
        serialNumber: Joi.string().required(),
        startReading: Joi.number().positive().required(),
        multiplier: Joi.number().valid(1, 10).required(),
        units: Joi.string().required(),
        readings: Joi.object()
      })
    })
  }),
  requiredLines: Joi.array().allow(null).optional(),
  lines,
  metadata: Joi.object(),
  user: userSchema,
  isUnderQuery: Joi.boolean()
};

/**
 * Schema for updating under query / received date only
 * @type {Object}
 */
const headerSchema = {
  returnId: Joi.string().required(),
  status: Joi.string().valid(statuses).required(),
  receivedDate: Joi.string().regex(isoDateRegex).allow(null).required(),
  user: userSchema,
  isUnderQuery: Joi.boolean().required()
};

/**
 * Compact schema for submitting a return from a multiple returns XML file
 * @type {Object}
 */
const multipleSchema = {
  returnId: Joi.string().regex(returnIDRegex).required(),
  licenceNumber: Joi.string().required(),
  receivedDate: Joi.string().regex(isoDateRegex).allow(null).required(),
  startDate: Joi.string().regex(isoDateRegex).required(),
  endDate: Joi.string().regex(isoDateRegex).required(),
  frequency: Joi.string().valid(allowedPeriods).required(),
  isNil: Joi.boolean().required(),
  reading: Joi.object({
    type: Joi.string().valid(readingTypes).required()
  }),
  lines,
  meters: Joi.array().items({
    manufacturer: Joi.string().required(),
    serialNumber: Joi.string().required()
  })
};

module.exports = {
  returnSchema,
  headerSchema,
  multipleSchema
};
