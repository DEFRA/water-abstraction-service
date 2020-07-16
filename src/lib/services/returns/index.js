'use strict';

const { flatMap, uniq } = require('lodash');
const apiConnector = require('./api-connector');
const repos = require('../../connectors/repos');
const purposeUseMapper = require('../../mappers/purpose-use');
const returnMapper = require('../../mappers/return');
const returnVersionMapper = require('../../mappers/return-version');

// Models
const { RETURN_STATUS } = require('../../models/return');

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Gets all non-void returns for the given licence number
 * within the supplied financial year
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @return {Promise<Array>}
 */
const fetchReturns = (licenceNumber, financialYear) => {
  const startDate = financialYear.start.format(DATE_FORMAT);
  const endDate = financialYear.end.format(DATE_FORMAT);
  return apiConnector.getReturnsForLicence(licenceNumber, startDate, endDate);
};

/**
 * Gets an array of purpose use codes from the supplied
 * set of returns
 * @param {Array<Object>} returns
 * @return {Array<String>}
 */
const getPurposeUseCodes = returns => {
  const codes = returns.map(ret =>
    ret.metadata.purposes.map(purpose =>
      purpose.tertiary.code
    ));

  return uniq(flatMap(codes));
};

/**
 * Gets all purpose uses from water.purpose_uses
 * for the supplied set of returns, and returns an
 * array of PurposeUse service models
 * @param {Array} returns
 * @return {Array<PurposeUse>}
 */
const getPurposeUses = async returns => {
  // Get purpose use codes from set of returns
  const purposeUseCodes = getPurposeUseCodes(returns);

  // Retrieve from water.purpose_uses and map to service models
  const purposeUses = await repos.purposeUses.findByCodes(purposeUseCodes);
  return purposeUses.map(purposeUseMapper.dbToModel);
};

/**
 * Loads the current return version and lines, maps to service models,
 * and decorates the supplied Return model with them
 * @param {Return} ret
 * @return {Promise<Return>}
 */
const decorateWithCurrentVersion = async ret => {
  if (ret.status !== RETURN_STATUS.completed) {
    return ret;
  }
  // Load current version
  const version = await apiConnector.getCurrentVersion(ret.id);
  if (!version) {
    return ret;
  }
  // Load lines
  let lines;
  if (!version.nil_return) {
    lines = await apiConnector.getLines(version.version_id);
  }
  // Map to service models
  ret.returnVersions = [
    returnVersionMapper.returnsServiceToModel(version, lines)
  ];
  return ret;
};

/**
 * Gets all returns for the licence in the supplied FinancialYear
 * Resolves with an array of Return service model instances, each
 * with the current version loaded
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @return {Promise<Array>}
 */
const getReturnsForLicenceInFinancialYear = async (licenceNumber, financialYear) => {
  // Get returns from returns service
  const data = await fetchReturns(licenceNumber, financialYear);

  // Load purpose uses from local table and map to service models
  const allPurposeUses = await getPurposeUses(data);

  // Map returns to service models
  const rets = data.map(returnData => returnMapper.returnsServiceToModel(returnData, allPurposeUses));

  // Decorate each return with its current version
  const tasks = rets.map(decorateWithCurrentVersion);
  return Promise.all(tasks);
};

exports.getReturnsForLicenceInFinancialYear = getReturnsForLicenceInFinancialYear;
