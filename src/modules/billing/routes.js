const Joi = require('@hapi/joi');

const controller = require('./controller');

const postCreateBatch = {
  method: 'POST',
  path: '/water/1.0/billing/batches',
  handler: controller.postCreateBatch,
  config: {
    validate: {
      payload: {
        userEmail: Joi.string().email().required(),
        regionId: Joi.string().uuid().required(),
        batchType: Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required(),
        financialYear: Joi.number().required(),
        season: Joi.string().valid('summer', 'winter', 'all year').required()
      }
    }
  }
};

exports.postCreateBatch = postCreateBatch;
