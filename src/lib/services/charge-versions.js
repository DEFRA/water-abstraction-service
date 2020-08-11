'use strict';

const service = require('./service');
const chargeVersionRepo = require('../connectors/repos/charge-versions');
const chargeVersionMapper = require('../mappers/charge-version');

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

const createChargeVersion = async chargeVersion => {
  const entity = chargeVersionMapper.modelToDb(chargeVersion);
  entity.source = 'wrls';

  const saved = await chargeVersionRepo.create(entity);
  return getByChargeVersionId(saved.chargeVersionId);
};

exports.createChargeVersion = createChargeVersion;
exports.getByChargeVersionId = getByChargeVersionId;
exports.getByLicenceRef = getByLicenceRef;
