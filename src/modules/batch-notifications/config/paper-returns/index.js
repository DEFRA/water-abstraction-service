'use strict';

const Joi = require('joi');

const eventHelpers = require('../../lib/event-helpers');
const { returnIDRegex } = require('@envage/water-abstraction-helpers').returns;
const { getRecipients } = require('./lib/get-recipients');

const OPTIONAL_NULLABLE_STRING = Joi.string().allow(null).optional();

const schema = Joi.object({
  forms: Joi.array().items(Joi.object({
    company: Joi.object({
      name: Joi.string().required(),
      type: Joi.string().required()
    }).required().unknown(),
    address: Joi.object({
      addressLine1: OPTIONAL_NULLABLE_STRING,
      addressLine2: OPTIONAL_NULLABLE_STRING,
      addressLine3: OPTIONAL_NULLABLE_STRING,
      addressLine4: OPTIONAL_NULLABLE_STRING,
      town: OPTIONAL_NULLABLE_STRING,
      county: OPTIONAL_NULLABLE_STRING,
      postcode: OPTIONAL_NULLABLE_STRING,
      country: OPTIONAL_NULLABLE_STRING
    }).unknown().required(),
    contact: Joi.object({
      initials: OPTIONAL_NULLABLE_STRING,
      middleInitials: OPTIONAL_NULLABLE_STRING,
      title: OPTIONAL_NULLABLE_STRING,
      firstName: OPTIONAL_NULLABLE_STRING,
      lastName: OPTIONAL_NULLABLE_STRING,
      suffix: OPTIONAL_NULLABLE_STRING,
      department: OPTIONAL_NULLABLE_STRING,
      type: OPTIONAL_NULLABLE_STRING,
      dataSource: OPTIONAL_NULLABLE_STRING
    }).unknown().allow(null).required(),
    returns: Joi.array().items(Joi.object({
      returnId: Joi.string().regex(returnIDRegex).required()
    }).unknown()).required()
  }))
});

module.exports = [
  {
    prefix: 'PRTF-',
    name: 'Paper returns',
    messageType: 'paperReturnForms',
    schema,
    getRecipients,
    createEvent: eventHelpers.createEvent
  }
];
