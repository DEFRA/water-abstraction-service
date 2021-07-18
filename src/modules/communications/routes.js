const Joi = require('joi');
const controller = require('./controller');
const { version } = require('../../../config');

module.exports = {
  getCommunication: {
    method: 'GET',
    path: `/water/${version}/communications/{communicationId}`,
    handler: controller.getCommunication,
    config: {
      description: 'Gets details of a sent notification and the associated CRM docs',
      validate: {
        params: Joi.object().keys({
          communicationId: Joi.string().guid()
        })
      }
    }
  }
};
