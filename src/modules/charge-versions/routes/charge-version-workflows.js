'use strict';

const { ROLES: { chargeVersionWorkflowEditor, chargeVersionWorkflowApprover } } = require('../../../lib/roles');

const { CHARGE_VERSION_WORKFLOW_STATUS } = require('../../../lib/models/charge-version-workflow');

const controller = require('../controllers/charge-version-workflow');
const Joi = require('joi');

module.exports = {

  getChargeVersionWorkflows: {
    method: 'GET',
    path: '/water/1.0/charge-version-workflows',
    handler: controller.getChargeVersionWorkflows,
    options: {
      description: 'Lists all charge version workflows in progress',
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowApprover]
      },
      validate: {
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        }
      }
    }
  },

  postChargeVersionWorkflow: {
    method: 'POST',
    path: '/water/1.0/charge-version-workflows',
    handler: controller.postChargeVersionWorkflow,
    options: {
      description: 'Creates a new charge version workflow record',
      auth: {
        scope: [chargeVersionWorkflowEditor, chargeVersionWorkflowApprover]
      },
      validate: {
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        },
        payload: {
          licenceId: Joi.string().guid().required(),
          chargeVersion: Joi.object().required()
        }
      }
    }
  }
};
