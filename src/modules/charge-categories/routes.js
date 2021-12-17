'use strict';

const controller = require('./controller');
const Joi = require('joi');
module.exports = {

  getChargeCategoryByDescription: {
    method: 'GET',
    path: '/water/1.0/charge-categories',
    handler: controller.getChargeCategoryByDescription,
    config: {
      validate: {
        query: Joi.object().keys({
          source: Joi.string().required().valid('Tidal', 'Non-tidal'),
          loss: Joi.string().required().valid('Low', 'Medium', 'High'),
          availability: Joi.string().required().valid('Restricted availablity or no availability', 'Available'),
          model: Joi.string().required().valid('No-model', 'Tier 1', 'Tier 2'),
          volume: Joi.number().integer().required()
        })
      }
    }
  }

};
