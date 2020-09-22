'use strict';

const { NotFoundError, ConflictingDataError } = require('../errors');

// Mappers
const licenceAgreementMapper = require('../mappers/licence-agreement');

// Repos
const licenceAgreementRepo = require('../connectors/repos/licence-agreements');

// Models
const DateRange = require('../models/date-range');
const Licence = require('../models/licence');
const LicenceAgreement = require('../models/licence-agreement');
const validators = require('../models/validators');

// Services
const agreementsService = require('./agreements');
const licencesService = require('./licences');

/**
 * Adds a new financial agreement to the specified licece
 * @param {Licence} licence
 * @param {String} code
 * @param {String} startDate
 * @param {String} signedDate
 */
const createLicenceAgreement = async (licence, code, startDate, dateSigned) => {
  validators.assertIsInstanceOf(licence, Licence);

  // Get financial agreement by code
  const agreement = await agreementsService.getAgreementByCode(code);
  if (!agreement) {
    throw new NotFoundError(`Financial agreement ${code} not found`);
  }

  // Construct licence agreement model
  const licenceAgreement = new LicenceAgreement();
  licenceAgreement.fromHash({
    dateRange: new DateRange(startDate),
    dateSigned,
    agreement
  });

  // Persist new row in water.licence_agreements
  try {
    const dbRow = await licenceAgreementRepo.create(
      licenceAgreementMapper.modelToDb(licenceAgreement, licence.licenceNumber)
    );

    await licencesService.flagForSupplementaryBilling(licence.id);

    // Return the updated model
    return licenceAgreementMapper.dbToModel(dbRow);
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictingDataError(`A ${code} agreement starting on ${startDate} already exists for licence ${licence.licenceNumber}`);
    }
    throw err;
  }
};

exports.createLicenceAgreement = createLicenceAgreement;
