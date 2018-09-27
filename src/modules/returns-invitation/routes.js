const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  postReturnsInvite: {
    path: '/water/1.0/returns-notifications/invite',
    method: 'POST',
    handler: controller.postReturnsInvite,
    config: {
      description: 'Sends invitation to do a return',
      validate: {

      }
    }
  }
};
