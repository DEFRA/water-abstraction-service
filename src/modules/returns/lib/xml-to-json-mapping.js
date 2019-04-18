const moment = require('moment');
const helpers = require('@envage/water-abstraction-helpers');
const { get, flatMap, uniq, find } = require('lodash');
const { getReturnId } = require('../../../lib/returns');
const returnsConnector = require('../../../lib/connectors/returns');
const permitConnector = require('../../../lib/connectors/permit');

const DATE_FORMAT = 'YYYY-MM-DD';

const options = {
  tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06'
};

const getText = (from, path) => from.get(path, options).text();

const getChildNames = node => node.childNodes().map(node => node.name());

const getReturnFrequency = (ret) => {
  const mapping = {
    DailyTotal: 'day',
    WeeklyTotal: 'week',
    MonthlyTotal: 'month',
    YearlyTotal: 'year'
  };

  const fullReturnStructure = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options);

  if (fullReturnStructure) {
    const childNames = getChildNames(fullReturnStructure);

    for (let key in mapping) {
      if (childNames.includes(key)) {
        return mapping[key];
      }
    }
  }
  return null;
};

const getNilReturn = (ret) => {
  const nilReturnStructure = ret
    .get('tns:GorPart', options)
    .get('tns:NilReturnStructure', options);

  if (nilReturnStructure) {
    return getText(nilReturnStructure, 'tns:IsNilReturn') === 'yes';
  }
  return false;
};

const getMeterDetails = (ret) => {
  if (getNilReturn(ret)) return [];

  const meterUsage = ret
    .get('tns:GorPart', options)
    .get('tns:FullReturnStructure', options)
    .find('tns:MeterUsage', options);

  return flatMap(meterUsage.map(meter => {
    if (!wasMeterUsed(meter)) return [];

    return {
      manufacturer: getText(meter, 'tns:EaListedManufacturer'),
      serialNumber: getText(meter, 'tns:SerialNumber'),
      meterDetailsProvided: true,
      multiplier: 1
    };
  }));
};

const wasMeterUsed = (meterUsage) => {
  return meterUsage.attr('WasMeterUsed').value() === 'Y';
};

const getOverallReadingType = (ret) => {
  const meterUsage = ret
    .get('tns:GorPart', options)
    .get('tns:FullReturnStructure', options)
    .get('tns:MeterUsage', options);

  return wasMeterUsed(meterUsage) ? 'measured' : 'estimated';
};

const getUnits = (ret) => {
  const unitOfMeasurement = ret
    .get('tns:GorPart', options)
    .get('tns:FullReturnStructure', options)
    .get('tns:UnitOfMeasurement', options)
    .text();

  return (unitOfMeasurement === 'CubicMetres') ? 'm³' : null;
};

const getReadingDetails = (ret) => {
  if (getNilReturn(ret)) return {};

  return {
    type: getOverallReadingType(ret),
    method: 'abstractionVolumes',
    units: getUnits(ret),
    totalFlag: false
  };
};

const getFrequencyNodePrefix = freq => {
  const mapping = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    year: 'Yearly'
  };
  return mapping[freq];
};

const getReturnLines = (ret) => {
  if (getNilReturn(ret)) return [];

  const freq = getReturnFrequency(ret);

  const xpath = `tns:GorPart/tns:FullReturnStructure/tns:${getFrequencyNodePrefix(freq)}Total/tns:${getFrequencyNodePrefix(freq)}ReturnLine`;

  const lines = ret.find(xpath, options);

  return lines.map(line => {
    const startDate = getText(line, 'tns:Date');
    return {
      startDate: getStartDate(startDate, freq),
      endDate: getEndDate(startDate, freq),
      quantity: parseFloat(getText(line, 'tns:AbstractedVolume')),
      timePeriod: freq,
      readingType: getReadingType(line)
    };
  });
};

/**
 * The start date is the start of the NALD week - Sunday - Saturday
 * @param  {String} startDate
 * @param  {String} freq      - frequency - day|week|month|year
 * @return {String}           - calculated date
 */
const getStartDate = (startDate, freq) => {
  if (freq === 'week') {
    return helpers.nald.dates.getWeek(startDate).start.format(DATE_FORMAT);
  }
  if (freq === 'month') {
    return moment(startDate).startOf('month').format(DATE_FORMAT);
  }
  return startDate;
};

const getEndDate = (startDate, freq) => {
  switch (freq) {
    case 'day':
      return startDate;
    case 'week':
      return helpers.nald.dates.getWeek(startDate).end.format(DATE_FORMAT);
    case 'month':
      return moment(startDate).endOf('month').format(DATE_FORMAT);
    case 'year':
      return moment(startDate).add(1, 'years').subtract(1, 'days').format(DATE_FORMAT);
  }
};

const getReadingType = (returnLine) => {
  const readingType = getText(returnLine, 'tns:EstimatedIndicator');
  return readingType === 'N' ? 'measured' : 'estimated';
};

const getPermitsFromXml = xmlDoc => xmlDoc.find('tns:Permit', options);

/**
 * Gets an array of licence numbers given a permits XML node
 * @param  {Array} permits - permit element nodes from XML
 * @return {Array}         - unique licence numbers in upload
 */
const getLicenceNumbersFromPermits = (permits) => {
  const licenceNumbers = permits.map(permit => getText(permit, 'tns:IrPermitNo'));
  return uniq(licenceNumbers);
};

const mapReturn = (returnXml, context) => {
  const { licenceNumber, licenceRegionCodes, user, receivedDate } = context;

  const returnRequirement = getText(returnXml, 'tns:ReturnRequirementId');
  const startDate = getText(returnXml, 'tns:ReturnReportingPeriodStartDate');
  const endDate = getText(returnXml, 'tns:ReturnReportingPeriodEndDate');
  const regionCode = licenceRegionCodes[licenceNumber];
  const returnId = getReturnId(regionCode, licenceNumber, returnRequirement, startDate, endDate);

  return {
    ...getXmlReturnSkeleton(),
    returnId,
    licenceNumber,
    receivedDate,
    startDate,
    endDate,
    frequency: getReturnFrequency(returnXml),
    isNil: getNilReturn(returnXml),
    reading: getReadingDetails(returnXml),
    meters: getMeterDetails(returnXml),
    lines: getReturnLines(returnXml),
    user: mapUser(user)
  };
};

/**
 * Given an array of permit nodes from the XML document, maps these to
 * an array of returns in the water service return shape.
 * Some fields (e.g. status, dueDate) are absent, as these are added in a later
 * step once the return IDs are known and the data can be loaded from the return
 * service.
 * @param  {Array} permits - array of XML node objects
 * @param  {Object} context - context data for mapping
 * @param {Object} context.licenceRegionCodes - a map of licences => region codes
 * @param {Object} context.user - the current application user
 * @param {String} context.receivedDate - YYYY-MM-DD date return received
 * @return {Array} list of returns
 */
const mapPermits = (permits, context) => {
  return flatMap(permits, permit => {
    const licenceNumber = getText(permit, 'tns:IrPermitNo');
    const returns = permit.find('tns:Return', options);
    return returns.map(ret => mapReturn(ret, { ...context, licenceNumber }));
  });
};

/**
 * Gets a basic shape for the return
 * @return {Object} [description]
 */
const getXmlReturnSkeleton = () => ({
  isUnderQuery: false,
  versionNumber: 1,
  isCurrent: true
});

/**
 * Gets the user type from an IDM user row
 * @param  {Object} user - IDM user row
 * @return {String} user type - internal|external
 */
const getUserType = user => {
  const scopes = get(user, 'role.scopes', []);
  return scopes.includes('external') ? 'external' : 'internal';
};

/**
 * Maps IDM user to the shape in the water service return model
 * @param  {Object} user - IDM user row
 * @return {Object} water service return model user
 */
const mapUser = user => ({
  email: user.user_name,
  type: getUserType(user),
  entityId: user.external_id
});

/**
 * Given an array of returns, gets all the return IDs
 * @param  {Array} returns - a list of return objects
 * @return {Array} list of return ID strings
 */
const getReturnIds = returns => returns.map(ret => ret.returnId);

/**
 * Augments the given return object with the status and due date
 * of the corresponding return in the data loaded from the returns service
 * @param  {Object} ret         - water service return object
 * @param  {Array} returnsData  - array of returns data loaded from returns service
 * @return {Array} array of modified returns
 */
const mapReturnsData = (ret, returnsData) => {
  const { returnId } = ret;
  const match = find(returnsData, { return_id: returnId });
  return {
    ...ret,
    status: 'completed',
    dueDate: get(match, 'due_date')
  };
};

const mapXml = async (xmlDoc, user, today) => {
  // Stage 1 - get licence numbers and region codes
  const permits = getPermitsFromXml(xmlDoc);
  const licenceNumbers = getLicenceNumbersFromPermits(permits);
  const licenceRegionCodes = await permitConnector.getLicenceRegionCodes(licenceNumbers);

  // Stage 2 - do basic mapping of XML data to returns
  const context = {
    licenceRegionCodes,
    user,
    receivedDate: moment(today).format(DATE_FORMAT)
  };
  const returns = mapPermits(permits, context);

  // Stage 3 - augment returns with data from returns service if found
  const returnIds = getReturnIds(returns);
  const returnsData = await returnsConnector.getActiveReturns(returnIds);

  return returns.map(row => mapReturnsData(row, returnsData));
};

exports.getReturnFrequency = getReturnFrequency;
exports.getNilReturn = getNilReturn;
exports.getMeterDetails = getMeterDetails;
exports.wasMeterUsed = wasMeterUsed;
exports.getOverallReadingType = getOverallReadingType;
exports.getUnits = getUnits;
exports.getReadingDetails = getReadingDetails;
exports.getReturnLines = getReturnLines;
exports.getEndDate = getEndDate;
exports.getReadingType = getReadingType;
exports.mapXml = mapXml;
