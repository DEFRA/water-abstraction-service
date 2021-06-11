'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controller');

module.exports = {
  getGaugingStation: {
    method: 'GET',
    path: '/water/1.0/gauging-stations/{stationGuid}',
    handler: controller.getGaugingStation,
    config: {
      validate: {
        params: Joi.object({
          stationGuid: Joi.string().uuid().required()
        })
      }
    }
  },
  getGaugingStationLicencesById: {
    path: '/water/1.0/gauging-stations/{gaugingStationId}/licences',
    method: 'GET',
    handler: controller.getGaugingStationLicencesById,
    config: {
      tags: ['api'],
      description: 'Gets a gauging station by id',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().required().guid()
        })
      }
    }
  },
  getGaugingStationByRef: {
    path: '/water/1.0/gauging-stations/by-ref/{ref}',
    method: 'GET',
    handler: controller.getGaugingStationByRef,
    config: {
      tags: ['api'],
      description: 'Gets a gauging station by ref',
      validate: {
        params: Joi.object({
          ref: Joi.string().required().min(2)
        })
      }
    }
  },
  createLicenceGaugingStationLink: {
    path: '/water/1.0/gauging-stations/{gaugingStationId}/licences',
    method: 'POST',
    handler: controller.createLicenceGaugingStationLink,
    config: {
      tags: ['api'],
      description: 'Creates a link between a gauging station and a licence',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().uuid().required()
        }),
        payload: Joi.object({
          licenceId: Joi.string().uuid().required(),
          licenceVersionPurposeConditionId: Joi.string().uuid().allow(null),
          thresholdUnit: Joi.string().required(),
          thresholdValue: Joi.number().required(),
          abstractionPeriod: Joi.object({
            startDay: Joi.number(),
            startMonth: Joi.number(),
            endDay: Joi.number(),
            endMonth: Joi.number()
          }).allow({}, null),
          restrictionType: Joi.string().required().allow('flow', 'level'),
          alertType: Joi.string().required().allow('stop', 'reduce', 'stop_or_reduce')
        })
      }
    }
  }
};
