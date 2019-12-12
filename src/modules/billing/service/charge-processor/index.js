const { get, flatMap, groupBy, cloneDeep, each, last } = require('lodash');

const MomentRange = require('moment-range');
const moment = MomentRange.extendMoment(require('moment'));

const helpers = require('@envage/water-abstraction-helpers');
const crm = require('../../../../lib/connectors/crm-v2/documents');
const crmMappers = require('./crm-mappers');
const dateHelpers = require('./date-helpers');

const { mergeHistory } = require('@envage/water-abstraction-helpers').charging;
const camelCaseKeys = require('../../../../lib/camel-case-keys');
const repository = require('../../../../lib/connectors/repository');
const { ERROR_CHARGE_VERSION_NOT_FOUND } = require('./errors');
const { modelMapper } = require('./model-mapper');
const camelCase = require('camelcase');

const DATE_FORMAT = 'YYYY-MM-DD';

const agreementTypes = ['S127', 'S130S', 'S130T', 'S130U', 'S130W'];

/**
 * Gets licence level agreements from water.licence_agreements
 * These can be S127/S130
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getLicenceAgreements = async licenceNumber => {
  const data = await repository.licenceAgreements.findByLicenceNumber(licenceNumber, agreementTypes);
  return data.map(row => ({
    code: row.financial_agreement_type_id,
    startDate: row.start_date,
    endDate: row.end_date
  }));
};

/**
 * Gets an array of document objects from the CRM
 * @todo This would be more efficient if it filtered
 *  the documents to ensure they are only cover the
 *  required date range
 * @param {String} licenceNumber
 * @return {Promise<Array>} a list of document objects
 */
const getCRMDocuments = async licenceNumber => {
  const documents = await crm.getDocuments(licenceNumber);
  const tasks = documents.map(doc => crm.getDocument(doc.documentId));
  return Promise.all(tasks);
};

/**
 * Checks whether the two supplied CRM document roles are
 * for the same combination of company and contact
 * Address changes are ignored
 * @param {Object} roleA - CRM document role
 * @param {Object} roleB - CRM document role
 * @return {Boolean}
 */
const isSameLicenceHolder = (roleA, roleB) =>
  get(roleA, 'company.companyId') === get(roleB, 'company.companyId') &&
  get(roleA, 'contact.contactId') === get(roleB, 'contact.contactId');

/**
 * The date range splitter function from water-abstraction-helpers
 * writes new dates to the supplied objects as
 * effectiveStartDate and effectiveEndDate
 * This function moves these to startDate and endDate so it can
 * be run through the date splitter again.
 * The original start/end dates are moved to originalStartDate and originalEndDate
 * @param {Object} obj
 * @return {Object}
 */
const applyEffectiveDates = obj => ({
  ...obj,
  startDate: moment(obj.effectiveStartDate).format(DATE_FORMAT),
  endDate: moment(obj.effectiveEndDate).format(DATE_FORMAT),
  originalStartDate: obj.startDate,
  originalEndDate: obj.endDate
});

/**
 * Loads charge version data from DB and camel-cases all keys
 * @param {String} chargeVersionId
 * @return {Promise<Object>}
 */
const getChargeVersion = async chargeVersionId => {
  const data = await repository.chargeVersions.findOneById(chargeVersionId);
  return camelCaseKeys(data);
};

/**
 * Loads charge element data from DB and camel-cases all keys
 * @param {String} chargeVersionId
 * @return {Promise<Array>}
 */
const getChargeElements = async chargeVersionId => {
  const data = await repository.chargeElements.findByChargeVersionId(chargeVersionId);
  return data.map(camelCaseKeys);
};

/**
 * Predicate to check whether the supplied charge element contains a time-limited
 * date range
 * @param {Object} chargeElement
 * @return {Boolean} true if the element is time limited
 */
const isTimeLimited = chargeElement =>
  !(chargeElement.timeLimitedStartDate === null && chargeElement.timeLimitedEndDate === null);

/**
 * Maps the abstraction period from a charge element into a shape
 * expected by the getBillableDays function in water-abstraction-helpers
 * @param {Object} chargeElement
 * @return {Object} abstraction period
 */
const getAbstractionPeriod = chargeElement => ({
  startDay: chargeElement.abstractionPeriodStartDay,
  startMonth: chargeElement.abstractionPeriodStartMonth,
  endDay: chargeElement.abstractionPeriodEndDay,
  endMonth: chargeElement.abstractionPeriodEndMonth
});

/**
 * Augments a charge element with information specific to this charge version/financial year etc.
 *
 * The start and end date are those for which this element is in effect for, ignoring the abs period
 *
 * The totalDays is the number of days this charge element would be billed for had it been in effect
 * for the full financial year, taking into account the abs period.
 *
 * The billableDays is the number of days this charge element should be billed for taking into account
 * the abs period and the limits of the start/end date range
 *
 * @param {Object} chargeVersion
 * @param {Object} chargeElement
 * @param {String} startDate
 * @param {String} endDate
 * @return {Object} augmented charge element
 */
const augmentElementWithBillingPeriod = (chargeVersion, chargeElement, startDate, endDate) => ({
  ...chargeElement,
  startDate,
  endDate,
  totalDays: helpers.charging.getBillableDays(getAbstractionPeriod(chargeElement), chargeVersion.financialYear.startDate, chargeVersion.financialYear.endDate),
  billableDays: helpers.charging.getBillableDays(getAbstractionPeriod(chargeElement), startDate, endDate)
});

/**
 * Calculates the date range and billable days for each charge element.
 * For time-limited elements:
 * - when there is overlap between this and the charge version date range, it is constrained
 * - when there is no overlap, the charge element is omitted
 * @param {Object} chargeVersion
 * @param {Array} chargeElements
 * @return {Array} processed chargeElements
 */
const chargeElementProcessor = (chargeVersion, chargeElements) => chargeElements.reduce((acc, row) => {
  // Non time-limited element
  if (!isTimeLimited(row)) {
    const { startDate, endDate } = chargeVersion;
    acc.push(augmentElementWithBillingPeriod(chargeVersion, row, startDate, endDate));
    return acc;
  }

  // Time-limited element
  const rangeA = moment.range(chargeVersion.startDate, chargeVersion.endDate);
  const rangeB = moment.range(row.timeLimitedStartDate, row.timeLimitedEndDate);
  const intersection = rangeA.intersect(rangeB);

  if (intersection) {
    const startDate = intersection.start.format(DATE_FORMAT);
    const endDate = intersection.end.format(DATE_FORMAT);
    acc.push(augmentElementWithBillingPeriod(chargeVersion, row, startDate, endDate));
  }

  return acc;
}, []);

const getPropertyKey = agreementCode => `section${(agreementCode.substr(1))}Agreement`;

/**
 * Processes licence-level agreements that affect charging
 * @param {Array} data
 * @param {String} licenceNumber
 * @return {Promise<Array>} data - split by charge agreement changes
 */
const processAgreements = async (data, licenceNumber) => {
  let updated = cloneDeep(data);
  const agreements = await getLicenceAgreements(licenceNumber, agreementTypes);
  const grouped = groupBy(agreements, row => row.code);

  each(grouped, (agreements, agreementCode) => {
    const propertyKey = getPropertyKey(agreementCode);
    const history = mergeHistory(agreements);
    const arr = updated
      .map(row => helpers.charging.dateRangeSplitter(row, history, propertyKey));
    updated = flatMap(arr).map(applyEffectiveDates);
  });

  // Convert all agreements to boolean
  return updated.map(row => {
    agreementTypes.forEach(agreementType => {
      const propertyKey = getPropertyKey(agreementType);
      row[propertyKey] = !!row[propertyKey];
    });
    return row;
  });
};

/**
 * Processes charging elements and augments charge data array
 * @param {Array} data
 * @param {String} chargeVersionId
 */
const processChargingElements = async (data, chargeVersionId) => {
  const chargeElements = await getChargeElements(chargeVersionId);
  return data.map(row => ({
    ...row,
    chargeElements: chargeElementProcessor(row, chargeElements)
  }));
};

/**
 * Augments charge version with licence holder details, and
 * splits into date ranges on changes to licence holder
 * @param {Object} data - charge version data
 * @param {Array} docs - CRM docs
 * @return {Array}
 */
const processLicenceHolders = (data, docs) => {
  const licenceHolders = mergeHistory(
    crmMappers.getLicenceHolderRoles(docs), isSameLicenceHolder
  );
  return helpers.charging
    .dateRangeSplitter(data, licenceHolders, 'licenceHolder')
    .map(applyEffectiveDates);
};

/**
 * Augments charge version with invoice account details, and
 * splits into date ranges on changes to invoice account
 * @param {Object} data - charge version data
 * @param {Array} docs - CRM docs
 * @return {Array}
 */
const processInvoiceAccounts = (data, docs) => {
  const billing = mergeHistory(crmMappers.getBillingRoles(docs));
  return flatMap(data.map(row => helpers.charging
    .dateRangeSplitter(row, billing, 'invoiceAccount')
    .map(applyEffectiveDates)));
};

/**
 * Gets the date range covered by the list of documents.  This is the start date
 * of the first document, and the end date of the last document in the list.
 * @param {Array} docs - an array of documents returned from CRM
 * @return {Object}
 */
const getDocumentDateRange = docs => ({
  startDate: docs[0].startDate,
  endDate: last(docs).endDate
});

/**
 * @TODO handle two-part billing summer/winter
 * @TODO split by licence-level agreements - TPT/canal
 *
 * @param {Number} year
 * @param {String} chargeVersionId
 * @param {Boolean} isTwoPart
 * @param {Boolean} isSummer
 */
const processCharges = async (year, chargeVersionId, isTwoPart = false, isSummer) => {
  const financialYear = dateHelpers.getFinancialYearRange(year);

  // Load charge version data
  const chargeVersion = await getChargeVersion(chargeVersionId);
  if (!chargeVersion) {
    return { error: ERROR_CHARGE_VERSION_NOT_FOUND, data: null };
  }

  // Load CRM docs
  const docs = await getCRMDocuments(chargeVersion.licenceRef);

  // Calculate the valid date range for this licence
  const documentDateRange = getDocumentDateRange(docs);

  // Constrain charge version dates by financial year
  const dateRange = dateHelpers.getSmallestDateRange([
    financialYear,
    chargeVersion,
    documentDateRange
  ]);
  let data = { chargeVersion, financialYear, ...dateRange, isTwoPart, isSummer };

  // Process and split into date ranges
  data = processLicenceHolders(data, docs);
  data = processInvoiceAccounts(data, docs);
  data = await processAgreements(data, chargeVersion.licenceRef);
  data = await processChargingElements(data, chargeVersionId);

  console.log(JSON.stringify(data, null, 2));

  return { error: null, data };
};

module.exports.processCharges = processCharges;
module.exports.modelMapper = modelMapper;
