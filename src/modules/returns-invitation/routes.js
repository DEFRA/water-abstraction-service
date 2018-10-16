const Joi = require('joi');
const controller = require('./controller');
const schema = require('./lib/schema');

const common = {
  method: 'POST',
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
};

module.exports = {

  postReturnsInvitePreview: {
    path: '/water/1.0/returns-notifications/invite/preview',
    handler: controller.postReturnsInvitePreview,
    ...common
  },

  postReturnsInvite: {
    path: '/water/1.0/returns-notifications/invite/send',
    handler: controller.postReturnsInvite,
    ...common
  }
};
