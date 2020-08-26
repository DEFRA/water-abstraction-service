'use strict';

const { get } = require('lodash');

const chargeVersionMapper = require('../../../lib/mappers/charge-version');
const userMapper = require('../../../lib/mappers/user');

const Boom = require('@hapi/boom');
const { logger } = require('../../../logger');

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

  if (chargeVersion) {
    try {
      return chargeVersionMapper.pojoToModel(chargeVersion);
    } catch (err) {
      logger.error('Error mapping charge version', err);
      return Boom.badData('Invalid charge version data');
    }
  }

  return h.continue;
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
  try {
    return userMapper.pojoToModel(internalCallingUser);
  } catch (err) {
    logger.error('Error mapping user', err);
    return Boom.badData('Invalid user data');
  };
};

exports.mapChargeVersion = mapChargeVersion;
exports.mapInternalCallingUser = mapInternalCallingUser;
