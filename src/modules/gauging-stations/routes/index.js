'use strict';

const Joi = require('@hapi/joi');
const { ROLES: { abstractionAlertsNotifications } } = require('../../../lib/roles');
const controller = require('../controller');

const VALID_DAY = Joi.number().integer().min(1).max(31);
const VALID_MONTH = Joi.number().integer().min(1).max(12);
const VALID_THRESHOLD_UNITS = Joi.string().required().allow('Ml/d', 'm3/s', 'm3/d', 'l/s', 'mAOD', 'mASD', 'm');

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
      auth: {
        scope: [abstractionAlertsNotifications]
      },
      description: 'Creates a link between a gauging station and a licence',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().uuid().required()
        }),
        payload: Joi.object({
          licenceId: Joi.string().uuid().required(),
          licenceVersionPurposeConditionId: Joi.string().uuid().allow(null),
          thresholdUnit: VALID_THRESHOLD_UNITS,
          thresholdValue: Joi.number().required(),
          abstractionPeriod: Joi.when('licenceVersionPurposeConditionId', {
            is: Joi.string().uuid(),
            then: Joi.forbidden().allow(null).allow({}),
            otherwise: Joi.object({
              startDay: VALID_DAY,
              startMonth: VALID_MONTH,
              endDay: VALID_DAY,
              endMonth: VALID_MONTH
            }).required()
          }),
          restrictionType: Joi.string().required().allow('flow', 'level'),
          alertType: Joi.string().required().allow('stop', 'reduce', 'stop_or_reduce')
        })
      }
    }
  }
};
