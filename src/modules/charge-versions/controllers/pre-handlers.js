'use strict';

const { get, sortBy } = require('lodash');

const chargeVersionMapper = require('../../../lib/mappers/charge-version');
const userMapper = require('../../../lib/mappers/user');
const chargeVersionWorkflowService = require('../services/charge-version-workflows');
const moment = require('moment');
const Boom = require('@hapi/boom');
const { logger } = require('../../../logger');
const licenceVersions = require('../../../lib/connectors/repos/licence-versions');

const mapOrThrowBoom = (entityName, data, mapper) => {
  try {
    return mapper.pojoToModel(data);
  } catch (err) {
    logger.error(`Error mapping ${entityName}`, err);
    return Boom.badData('Invalid charge version data');
  }
};

/**
 * Maps a pojo representation of a charge version in the request payload
 * to a ChargeVersion service model
 * If mapping fails, a Boom badData error is returned
 * @param {Object} request.payload.chargeVersion
 * @param {Object} h - hapi response toolkit
 * @return {ChargeVersion} - if mapped
 */
const mapChargeVersion = (request, h) => {
  const { chargeVersion } = request.payload;

  return chargeVersion
    ? mapOrThrowBoom('charge version', chargeVersion, chargeVersionMapper)
    : h.continue;
};

/**
 * Maps a pojo representation of a user in the request payload
 * to a User service model
 * If mapping fails, a Boom badData error is returned
 * @param {Object} request.defra.internalCallingUser
 * @param {Object} h - hapi response toolkit
 * @return {User} - if mapped
 */
const mapInternalCallingUser = (request, h) => {
  const internalCallingUser = get(request, 'defra.internalCallingUser', null);
  return mapOrThrowBoom('user', internalCallingUser, userMapper);
};

const loadChargeVersionWorkflow = async request => {
  const { chargeVersionWorkflowId } = request.params;
  const chargeVersionWorkflow = await chargeVersionWorkflowService.getById(chargeVersionWorkflowId);

  if (!chargeVersionWorkflow) {
    return Boom.notFound(`No charge version workflow found with id: ${chargeVersionWorkflowId}`);
  }

  return chargeVersionWorkflow;
};
const getPaddedVersionString = version => version.toString().padStart(9, '0');
const getSortableVersionNumber = obj => parseFloat(`${getPaddedVersionString(obj.issue)}.${getPaddedVersionString(obj.increment)}`);

const loadLicenceVersion = async request => {
  const { licenceId, chargeVersion } = request.payload;
  const startDate = new Date(chargeVersion.dateRange.startDate);
  try {
    //  Find non 'draft' licence versions for the licenceId where the draft charge version start date is in the date range of
    //  licence versions then pick the licence version with the greatest version number.
    const versions = await licenceVersions.findByLicenceId(licenceId);
    const versionsFiltered = versions.filter(v => v.status !== 'draft' && moment.range(v.startDate, v.endDate).contains(startDate));
    return sortBy(versionsFiltered, getSortableVersionNumber).pop();
  } catch (err) {
    return Boom.notFound(`Licence version not found for licence ${licenceId}`);
  }
};

exports.loadLicenceVersion = loadLicenceVersion;
exports.mapChargeVersion = mapChargeVersion;
exports.mapInternalCallingUser = mapInternalCallingUser;
exports.loadChargeVersionWorkflow = loadChargeVersionWorkflow;
