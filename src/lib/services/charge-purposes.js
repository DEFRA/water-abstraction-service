'use strict';

const ChargeElement = require('../models/charge-element');
const ChargePurpose = require('../models/charge-purpose');

const validators = require('../models/validators');

const { CHARGE_SEASON } = require('../models/constants');
const AbstractionPeriod = require('../models/abstraction-period');
const SPRAY_ANTI_FROST = '380';

const chargePurposeMapper = require('../mappers/charge-purpose');
const chargePurposeRepo = require('../connectors/repos/charge-purposes');

const calculateSeason = (purposeUse, abstractionPeriod) => {
  if (purposeUse.isTwoPartTariff) {
    if (purposeUse.code === SPRAY_ANTI_FROST) {
      return CHARGE_SEASON.allYear;
    }

    const winter = AbstractionPeriod.getWinter();
    return abstractionPeriod.isWithinAbstractionPeriod(winter)
      ? CHARGE_SEASON.winter
      : CHARGE_SEASON.summer;
  }

  return abstractionPeriod.getChargeSeason();
};

const getIsFactorsOverridden = chargePurpose => {
  const { loss, purposeUse } = chargePurpose;
  return loss !== purposeUse.lossFactor;
};

/**
 * Creates a new charge element in the specified charge version
 * @param {ChargeElement} chargeElement
 * @param {ChargePurpose} chargePurpose
 * @return {Promise<ChargeElement>} persisted charge element
 */
const create = async (chargeElement, chargePurpose) => {
  validators.assertIsInstanceOf(chargePurpose, ChargePurpose);
  validators.assertIsInstanceOf(chargeElement, ChargeElement);
  chargePurpose.isFactorsOverridden = getIsFactorsOverridden(chargePurpose);
  const dbRow = chargePurposeMapper.modelToDb(chargePurpose, chargeElement);
  const result = await chargePurposeRepo.create(dbRow);
  return chargePurposeMapper.dbToModel(result);
};

exports.create = create;
exports._getIsFactorsOverridden = getIsFactorsOverridden;
