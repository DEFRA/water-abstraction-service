'use strict';

const { ROLES: { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer, viewChargeVersions } } = require('../../../lib/roles');

const controller = require('../controllers/charge-version-workflow');
const Joi = require('joi');
const preHandlers = require('../controllers/pre-handlers');

const headers = async values => {
  Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
};

module.exports = {

  getChargeVersionWorkflows: {
    method: 'GET',
    path: '/water/1.0/charge-version-workflows',
    handler: controller.getChargeVersionWorkflows,
    options: {
      description: 'Lists all charge version workflows in progress',
      tags: ['api'],
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer, viewChargeVersions]
      },
      validate: {
        headers,
        query: Joi.object().keys({
          licenceId: Joi.string().guid().optional(),
          page: Joi.number().integer().optional(),
          perPage: Joi.number().integer().optional(),
          tabFilter: Joi.string().optional().valid('to_setup', 'review', 'changes_requested')
        })
      }
    }
  },

  getChargeVersionWorkflow: {
    method: 'GET',
    path: '/water/1.0/charge-version-workflows/{chargeVersionWorkflowId}',
    handler: controller.getChargeVersionWorkflow,
    options: {
      description: 'Gets a single charge version workflow record',
      tags: ['api'],
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer, viewChargeVersions]
      },
      validate: {
        headers,
        params: Joi.object().keys({
          chargeVersionWorkflowId: Joi.string().guid().required()
        })
      }
    }
  },

  postChargeVersionWorkflow: {
    method: 'POST',
    path: '/water/1.0/charge-version-workflows',
    handler: controller.postChargeVersionWorkflow,
    options: {
      description: 'Creates a new charge version workflow record',
      tags: ['api'],
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer]
      },
      validate: {
        headers,
        payload: Joi.object().keys({
          licenceId: Joi.string().guid().required(),
          chargeVersion: Joi.object().required()
        })
      },
      pre: [
        { method: preHandlers.mapChargeVersion, assign: 'chargeVersion' },
        { method: preHandlers.mapInternalCallingUser, assign: 'user' }
      ]
    }
  },

  patchChargeVersionWorkflow: {
    method: 'PATCH',
    path: '/water/1.0/charge-version-workflows/{chargeVersionWorkflowId}',
    handler: controller.patchChargeVersionWorkflow,
    options: {
      description: 'Updates an existing charge version workflow record',
      tags: ['api'],
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer]
      },
      validate: {
        headers,
        payload: Joi.object().keys({
          status: Joi.string(),
          chargeVersion: Joi.object(),
          approverComments: Joi.string().allow(null),
          createdBy: Joi.object({
            id: Joi.number().greater(0).required(),
            email: Joi.string().email().lowercase().trim().required()
          }).optional()
        })
      },
      pre: [
        { method: preHandlers.mapChargeVersion, assign: 'chargeVersion' }
      ]
    }
  },

  deleteChargeVersionWorkflow: {
    method: 'DELETE',
    path: '/water/1.0/charge-version-workflows/{chargeVersionWorkflowId}',
    handler: controller.deleteChargeVersionWorkflow,
    options: {
      description: 'Deletes an existing charge version workflow record',
      tags: ['api'],
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer]
      },
      validate: {
        headers,
        params: Joi.object().keys({
          chargeVersionWorkflowId: Joi.string().guid().required()
        })
      },
      pre: [
        { method: preHandlers.loadChargeVersionWorkflow, assign: 'chargeVersionWorkflow' }
      ]
    }
  }
};
