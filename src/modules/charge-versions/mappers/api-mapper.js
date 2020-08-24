'use strict';

/**
 * @module maps service models to simpler shape for the API list view
 */

const objectMapper = require('object-mapper');

const apiListMap = {
  'chargeVersionWorkflow.id': 'id',
  'chargeVersionWorkflow.licence.licenceNumber': 'licenceNumber',
  'chargeVersionWorkflow.chargeVersion.startDate': 'startDate',
  'chargeVersionWorkflow.createdBy': 'createdBy',
  'chargeVersionWorkflow.status': 'status',
  'chargeVersionWorkflow.approverComments': 'approverComments',
  'licenceHolderRole.company.name': 'licenceHolder'
};

/**
 * Converts ChargeVersionWorkflow service model to a row for display in the API list view
 * @param {Object}
 * @param {ChargeVersionWorkflow} model.chargeVersionWorkflow
 * @param {Role} model.licenceHolderRole
 * @return {Object}
 */
const rowToAPIList = model => objectMapper(model, apiListMap);

exports.rowToAPIList = rowToAPIList;
