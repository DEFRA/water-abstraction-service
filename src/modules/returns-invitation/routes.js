const Joi = require('joi');
const controller = require('./controller');
const schema = require('./lib/schema');

module.exports = {

  postReturnsInvite: {
    path: '/water/1.0/returns-notifications/invite',
    method: 'POST',
    handler: controller.postReturnsInvite,
    config: {
      description: 'Sends invitation to do a return',
      validate: {
        payload: {
          config: schema.config,
          filter: Joi.object(),
          personalisation: Joi.object()
        }
      }
    }
  }
};
