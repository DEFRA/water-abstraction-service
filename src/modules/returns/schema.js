const Joi = require('joi');
const isoDateRegex = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;
const allowedPeriods = ['year', 'month', 'week', 'day'];
const readingTypes = ['estimated', 'measured'];
const statuses = ['due', 'completed', 'received'];
const units = ['m³', 'l', 'Ml', 'gal'];
const userTypes = ['internal', 'external'];

const userSchema = Joi.object().required().keys({
  email: Joi.string().required(),
  type: Joi.string().valid(userTypes).required(),
  entityId: Joi.string().guid().required()
});

const returnSchema = {
  returnId: Joi.string().required(),
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
  user: userSchema
};

const headerSchema = {
  returnId: Joi.string().required(),
  status: Joi.string().valid(statuses).required(),
  receivedDate: Joi.string().regex(isoDateRegex).allow(null).required(),
  user: userSchema
};

module.exports = {
  returnSchema,
  headerSchema
};
