'use strict';

const ChargeElement = require('../models/charge-element');
const ChargeVersion = require('../models/charge-version');

const validators = require('../models/validators');

const { CHARGE_SEASON, SCHEME } = require('../models/constants');
const AbstractionPeriod = require('../models/abstraction-period');
const SPRAY_ANTI_FROST = '380';

const chargeElementMapper = require('../mappers/charge-element');
const chargeElementRepo = require('../connectors/repos/charge-elements');

const chargePurposesService = require('./charge-purposes');

const unitConversion = require('../../lib/unit-conversion');
const toFixed = require('../../lib/to-fixed');

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

const getIsFactorsOverridden = chargeElement => {
  if (chargeElement.scheme === 'alcs') {
    const { source, season, loss, purposeUse, abstractionPeriod } = chargeElement;
    const isLossMismatch = loss !== purposeUse.lossFactor;
    const isSeasonMismatch = season !== calculateSeason(purposeUse, abstractionPeriod);
    const isSourceNotUnsupported = source !== ChargeElement.sources.unsupported;
    return isLossMismatch || isSeasonMismatch || isSourceNotUnsupported;
  } else {
    return false; // todo requires implementation for SROC if required
  }
};

/**
 * Takes a LicenceVersion object and translates the data into the default charge
 * data for that version of the licence.
 *
 * @param {LicenceVersion} licenceVersion The licence version and child purpose data to use to create the ChargeElements
 */
const getChargeElementsFromLicenceVersion = licenceVersion => {
  return licenceVersion.licenceVersionPurposes.map(licenceVersionPurpose => {
    const chargeElement = new ChargeElement();
    chargeElement.source = 'unsupported';
    chargeElement.loss = licenceVersionPurpose.purposeUse.lossFactor;
    chargeElement.abstractionPeriod = licenceVersionPurpose.abstractionPeriod;
    chargeElement.authorisedAnnualQuantity = toFixed(
      unitConversion.cubicMetresToMegalitres(licenceVersionPurpose.annualQuantity || 0), 6
    );
    chargeElement.billableAnnualQuantity = null;
    chargeElement.purposePrimary = licenceVersionPurpose.purposePrimary;
    chargeElement.purposeSecondary = licenceVersionPurpose.purposeSecondary;
    chargeElement.purposeUse = licenceVersionPurpose.purposeUse;
    chargeElement.description = licenceVersionPurpose.purposeUse.name;
    chargeElement.season = calculateSeason(licenceVersionPurpose.purposeUse, licenceVersionPurpose.abstractionPeriod);

    if (licenceVersionPurpose.timeLimitedPeriod) {
      chargeElement.timeLimitedPeriod = licenceVersionPurpose.timeLimitedPeriod;
    }

    return chargeElement;
  });
};

/**
 * Creates a new charge element in the specified charge version
 * @param {ChargeVersion} chargeVersion
 * @param {ChargeElement} chargeElement
 * @return {Promise<ChargeElement>} persisted charge element
 */
const create = async (chargeVersion, chargeElement) => {
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
  validators.assertIsInstanceOf(chargeElement, ChargeElement);
  chargeElement.isFactorsOverridden = getIsFactorsOverridden(chargeElement);
  const dbRow = chargeElementMapper.modelToDb(chargeElement, chargeVersion);
  const result = await chargeElementRepo.create(dbRow);
  const persistedChargeElement = chargeElementMapper.dbToModel(result);
  // Persist charge purposes if scheme is sroc
  if (chargeElement.scheme === SCHEME.sroc) {
    const tasks = chargeElement.chargePurposes.map(chargePurpose =>
      chargePurposesService.create(persistedChargeElement, chargePurpose)
    );
    persistedChargeElement.chargePurposes = await Promise.all(tasks);
  }
  return persistedChargeElement;
};

exports.getChargeElementsFromLicenceVersion = getChargeElementsFromLicenceVersion;
exports.create = create;
exports._getIsFactorsOverridden = getIsFactorsOverridden;
