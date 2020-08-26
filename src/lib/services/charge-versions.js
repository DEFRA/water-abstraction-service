'use strict';

const service = require('./service');
const chargeVersionRepo = require('../connectors/repos/charge-versions');
const chargeVersionMapper = require('../mappers/charge-version');
const licencesService = require('./licences');

/**
 * Gets charge version by ID
 * @param {String} chargeVersionId
 * @return {Promise<ChargeVersion>}
 */
const getByChargeVersionId = async chargeVersionId =>
  service.findOne(
    chargeVersionId,
    chargeVersionRepo.findOne,
    chargeVersionMapper
  );

/**
 * Gets all the charge versions for the given licence ref
 *
 * @param {String} licenceRef The licence ref/number
 */
const getByLicenceRef = async licenceRef =>
  service.findMany(
    licenceRef,
    chargeVersionRepo.findByLicenceRef,
    chargeVersionMapper
  );

const getByLicenceId = async licenceId => {
  const licence = await licencesService.getLicenceById(licenceId);
  return getByLicenceRef(licence.licenceNumber);
};

exports.getByChargeVersionId = getByChargeVersionId;
exports.getByLicenceId = getByLicenceId;
exports.getByLicenceRef = getByLicenceRef;
