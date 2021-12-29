'use strict';

const controller = require('./controller');
const Joi = require('joi');
module.exports = {

  getChargeCategoryByProperties: {
    method: 'GET',
    path: '/water/1.0/charge-categories',
    handler: controller.getChargeCategoryByProperties,
    config: {
      validate: {
        query: Joi.object().keys({
          source: Joi.string().required().valid('tidal', 'non-tidal'),
          loss: Joi.string().required().valid('low', 'medium', 'high'),
          availability: Joi.string().required().valid('restricted availablity or no availability', 'available'),
          model: Joi.string().required().valid('no model', 'tier 1', 'tier 2'),
          volume: Joi.number().integer().required()
        })
      }
    }
  }

};