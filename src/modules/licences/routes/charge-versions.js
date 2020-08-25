'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/charge-versions');

module.exports = {
  getChargeVersionsByLicence: {
    method: 'GET',
    path: '/water/1.0/licences/{licenceId}/charge-versions',
    handler: controller.getLicenceChargeVersions,
    config: {
      validate: {
        params: {
          licenceId: Joi.string().uuid().required()
        }
      }
    }
  }
};
