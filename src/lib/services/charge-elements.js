'use strict';

const ChargeElement = require('../models/charge-element');
const ChargeVersion = require('../models/charge-version');

const validators = require('../models/validators');

const { CHARGE_SEASON } = require('../models/constants');
const AbstractionPeriod = require('../models/abstraction-period');
const SPRAY_ANTI_FROST = '380';

const chargeElementMapper = require('../mappers/charge-element');
const chargeElementRepo = require('../connectors/repos/charge-elements');

const calculateSeason = licenceVersionPurpose => {
  const { code } = licenceVersionPurpose.purposeUse;

  if (code === SPRAY_ANTI_FROST) {
    return CHARGE_SEASON.allYear;
  }

  if (licenceVersionPurpose.purposeUse.isTwoPartTariff) {
    const winter = AbstractionPeriod.getWinter();
    return licenceVersionPurpose.abstractionPeriod.isWithinAbstractionPeriod(winter)
      ? CHARGE_SEASON.winter
      : CHARGE_SEASON.summer;
  }

  return licenceVersionPurpose.abstractionPeriod.getChargeSeason();
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
    chargeElement.authorisedAnnualQuantity = licenceVersionPurpose.annualQuantity | null;
    chargeElement.billableAnnualQuantity = null;
    chargeElement.purposePrimary = licenceVersionPurpose.purposePrimary;
    chargeElement.purposeSecondary = licenceVersionPurpose.purposeSecondary;
    chargeElement.purposeUse = licenceVersionPurpose.purposeUse;
    chargeElement.description = licenceVersionPurpose.purposeUse.name;
    chargeElement.season = calculateSeason(licenceVersionPurpose);

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
  const dbRow = chargeElementMapper.modelToDb(chargeElement, chargeVersion);
  const result = await chargeElementRepo.create(dbRow);
  return chargeElementMapper.dbToModel(result);
};

exports.getChargeElementsFromLicenceVersion = getChargeElementsFromLicenceVersion;
exports.create = create;
