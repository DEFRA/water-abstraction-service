'use strict'

const Joi = require('joi')
const { ROLES: { manageGaugingStationLicenceLinks } } = require('../../../lib/roles')
const controller = require('../controller')

const VALID_DAY = Joi.number().integer().min(1).max(31)
const VALID_MONTH = Joi.number().integer().min(1).max(12)
const VALID_THRESHOLD_UNITS = Joi.string().required().valid('Ml/d', 'm3/s', 'm3/d', 'l/s', 'mAOD', 'mBOD', 'mASD', 'm', 'SLD')

module.exports = {
  getGaugingStations: {
    method: 'GET',
    path: '/water/1.0/gauging-stations',
    handler: controller.getGaugingStations
  },
  getGaugingStation: {
    method: 'GET',
    path: '/water/1.0/gauging-stations/{stationGuid}',
    handler: controller.getGaugingStation,
    config: {
      validate: {
        params: Joi.object().keys({
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
        params: Joi.object().keys({
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
        params: Joi.object().keys({
          ref: Joi.string().required().min(2)
        })
      }
    }
  },
  getGaugingStationsByLicenceId: {
    path: '/water/1.0/licences/{licenceId}/gauging-stations',
    method: 'GET',
    handler: controller.getGaugingStationsByLicenceId,
    config: {
      tags: ['api'],
      description: 'Gets gauging stations by licenceId',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().required().guid()
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
        scope: [manageGaugingStationLicenceLinks]
      },
      description: 'Creates a link between a gauging station and a licence',
      validate: {
        params: Joi.object().keys({
          gaugingStationId: Joi.string().uuid().required()
        }),
        payload: Joi.object().keys({
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
  },
  deleteLinkageBetweenGaugingStationAndLicence: {
    path: '/water/1.0/licence-gauging-stations/{licenceGaugingStationId}',
    method: 'DELETE',
    handler: controller.deleteLicenceGaugingStationLink,
    config: {
      tags: ['api'],
      auth: {
        scope: [manageGaugingStationLicenceLinks]
      },
      description: 'Destroys a link between a gauging station and a licence',
      validate: {
        params: Joi.object().keys({
          licenceGaugingStationId: Joi.string().uuid().required()
        })
      }
    }
  }
}
