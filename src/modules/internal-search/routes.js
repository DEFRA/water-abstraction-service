const Joi = require('joi');
const controller = require('./controller');
const { version } = require('../../../config');

module.exports = {

  getSearch: {
    method: 'GET',
    path: `/water/${version}/internal-search`,
    handler: controller.getInternalSearch,
    config: {
      description: 'Provides a search API for internal users',
      validate: {
        query: {
          query: Joi.string().trim(),
          page: Joi.number().default(1)
        }
      }
    }
  }
};
