const Joi = require('joi');
const { get } = require('lodash');
const uuidv4 = require('uuid/v4');

/**
 * Checks whether the supplied message ref is a PDF.
 * Message refs beginning pdf. indicate a PDF message
 * @param {String} messageRef - the message ref
 * @return {Boolean}
 */
const isPdf = (messageRef) => {
  return /^pdf\./i.test(messageRef);
};

/**
 * Validates the options passed to enqueue
 * @param {Object} options
 * @param {String} now - ISO 8601 current timestamp
 * @return {Object} - with {error, value }
 */
function validateEnqueueOptions (options, now = new Date()) {
  // Validate input options

  const JoiCustomisedToAcceptStringAsObject = Joi.extend((joi) => {
    return {
      type: 'objectOrStringifiedObject',
      base: joi.any(),
      coerce (value, helpers) {
        if (['undefined', 'object'].includes(typeof value)) {
          return { value };
        } else if (value[0] === '{') {
          return { value: JSON.parse(value) };
        } else {
          return { value, errors: helpers.error('object.invalid') };
        }
      }
    };
  });

  const schema = Joi.object({
    id: Joi.string().default(uuidv4()),
    messageRef: Joi.string().required(),
    recipient: Joi.string().default('n/a'),
    personalisation: JoiCustomisedToAcceptStringAsObject.objectOrStringifiedObject(),
    sendAfter: Joi.string().default(now),
    licences: Joi.array().items(Joi.string()).default([]),
    individualEntityId: Joi.string().guid().allow(null),
    companyEntityId: Joi.string().guid().allow(null),
    eventId: Joi.string().guid(),
    metadata: JoiCustomisedToAcceptStringAsObject.objectOrStringifiedObject(),
    messageType: Joi.string().valid('letter', 'email', 'sms')
  });

  return schema.validate(options);
}

/**
 * Parses sent response from Notify and maps it to fields in
 * scheduled_notification table
 * @param {Object} notifyResponse
 * @return {Object} field values
 */
const parseSentResponse = (notifyResponse) => {
  const notifyId = get(notifyResponse, 'body.id', null);
  const plainText = get(notifyResponse, 'body.content.body', '');
  return {
    status: 'sent',
    notify_id: notifyId,
    plaintext: plainText
  };
};

module.exports = {
  validateEnqueueOptions,
  isPdf,
  parseSentResponse
};
