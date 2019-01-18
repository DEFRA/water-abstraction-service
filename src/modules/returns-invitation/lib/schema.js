const Joi = require('joi');
const moment = require('moment');

const config = {

  // Friendly name for this notification
  name: Joi.string(),

  // Prefix, where an event is created with a reference, this is the prefix
  // to the random value
  prefix: Joi.string(),

  // For non-PDF messages, corresponds to the Notify template to use.
  // PDF messages have pdf. suffix and are rendered locally
  messageRef: {
    default: Joi.string(),
    email: Joi.string(),
    letter: Joi.string()
  },

  // Array of contact roles, message will be sent to first match
  rolePriority: Joi.array().min(1).items(Joi.string()),

  // Email address of the user sending the notification
  issuer: Joi.string().email(),

  sendAfter: Joi.string().default(() => {
    return moment().format();
  }, 'timestamp'),

  deDupe: Joi.boolean().default(true)

};

module.exports = {
  config
};
