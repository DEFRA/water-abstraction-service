'use strict';

const { sortBy } = require('lodash');
const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const chargeVersionRepo = require('../connectors/repos/charge-versions');
const chargeVersionMapper = require('../mappers/charge-version');

// Services
const service = require('./service');
const licencesService = require('./licences');
const chargeElementsService = require('./charge-elements');

// Models
const ChargeVersionWorkflow = require('../models/charge-version-workflow');
const ChargeVersion = require('../models/charge-version');
const validators = require('../models/validators');

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

/**
 * Creates a new charge version in the DB
 * @param {ChargeVersion} chargeVersion
 * @return {Promise<ChargeVersion>} persisted charge version
 */
const create = async chargeVersion => {
  validators.assertIsInstanceOf(chargeVersion, ChargeVersion);
  const dbRow = chargeVersionMapper.modelToDb(chargeVersion);
  const result = await chargeVersionRepo.create(dbRow);
  return chargeVersionMapper.dbToModel(result);
};

const isCurrentChargeVersion = chargeVersion => chargeVersion.status === ChargeVersion.STATUS.current;
const getStartDate = chargeVersion => chargeVersion.dateRange.startDate;

/**
 * Updates all the end dates of the current charge versions so they end
 * the day before the next one in the sequence begins.
 * @param {Array<ChargeVersion>} chargeVersions
 */
const refreshEndDates = chargeVersions => {
  const filtered = chargeVersions.filter(isCurrentChargeVersion);
  const sorted = sortBy(filtered, getStartDate);

  return sorted.map((chargeVersion, i, arr) => {
    const isLast = i === arr.length - 1;
    chargeVersion.dateRange.endDate = isLast
      ? null
      : moment(arr[i + 1].dateRange.startDate, DATE_FORMAT).subtract(1, 'day').format(DATE_FORMAT);
    return chargeVersion;
  });
};

/**
 * If there is an existing current charge version that starts on the same day
 * as the newly created one, the new one replaces it.
 * Therefore the existing charge version has its status set to 'superseded'
 * @param {ChargeVersion} newChargeVersion
 * @param {Array<ChargeVersion>} existingChargeVersions
 */
const refreshStatus = (newChargeVersion, existingChargeVersions) => {
  const filtered = existingChargeVersions.filter(isCurrentChargeVersion);
  return filtered.map(chargeVersion => {
    if (chargeVersion.dateRange.startDate === newChargeVersion.dateRange.startDate) {
      chargeVersion.status = ChargeVersion.STATUS.superseded;
    }
    return chargeVersion;
  });
};

const getNextVersionNumber = existingChargeVersions => existingChargeVersions.reduce((acc, chargeVersion) =>
  Math.max(acc, chargeVersion.versionNumber + 1)
, 1);

/**
 * Creates a charge version from the supplied charge version workflow
 * @param {ChargeVersionWorkflow} chargeVersionWorkflow
 * @return {Promise<ChargeVersion>}
 */
const createFromWorkflow = async chargeVersionWorkflow => {
  validators.assertIsInstanceOf(chargeVersionWorkflow, ChargeVersionWorkflow);

  const { licence } = chargeVersionWorkflow.chargeVersion;

  // Get existing charge versions for licence
  const existingChargeVersions = await getByLicenceRef(licence.licenceNumber);

  chargeVersionWorkflow.chargeVersion.fromHash({
    source: ChargeVersion.SOURCE.wrls,
    status: ChargeVersion.STATUS.current,
    versionNumber: getNextVersionNumber(existingChargeVersions)
  });

  refreshStatus(chargeVersionWorkflow.chargeVersion, existingChargeVersions);
  refreshEndDates([chargeVersionWorkflow.chargeVersion, ...existingChargeVersions]);

  // Persist new charge version
  const chargeVersion = await create(chargeVersionWorkflow.chargeVersion);

  // Persist new charge elements
  const createElementTasks = chargeVersionWorkflow.chargeVersion.chargeElements.map(chargeElement =>
    chargeElementsService.create(chargeVersion, chargeElement)
  );

  // Update existing charge versions
  const updateExistingChargeVersionTasks = existingChargeVersions.map(chargeVersion => {
    const changes = {
      status: chargeVersion.status,
      endDate: chargeVersion.dateRange.endDate
    };
    console.log(chargeVersion.id, changes);
    return chargeVersionRepo.update(chargeVersion.id, changes);
  });

  await Promise.all([
    ...createElementTasks,
    ...updateExistingChargeVersionTasks,
    licencesService.flagForSupplementaryBilling(licence.id)
  ]);

  // @TODO delete workflow

  return getByChargeVersionId(chargeVersion.id);
};

exports.getByChargeVersionId = getByChargeVersionId;
exports.getByLicenceId = getByLicenceId;
exports.getByLicenceRef = getByLicenceRef;
exports.createFromWorkflow = createFromWorkflow;
