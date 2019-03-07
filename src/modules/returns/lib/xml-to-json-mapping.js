const moment = require('moment');
const { get, flatMap, uniq } = require('lodash');
const { getReturnId } = require('../../../lib/returns');
const returnsConnector = require('../../../lib/connectors/returns');
const permitConnector = require('../../../lib/connectors/permit');

const options = {
  tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06'
};

const getText = (from, path) => from.get(path, options).text();

const getReturnFrequency = (ret) => {
  const fullReturnStructure = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options);
  if (fullReturnStructure) {
    const freq = fullReturnStructure.child(5).name();
    if (freq === 'DailyTotal') return 'day';
    return freq.slice(0, -7).toLowerCase();
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
      units: getUnits(ret),
      manufacturer: getText(meter, 'tns:EaListedManufacturer'),
      serialNumber: getText(meter, 'tns:SerialNumber')
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
    method: 'AbstractedVolume',
    units: getUnits(ret)
  };
};

const getReturnLines = (ret) => {
  if (getNilReturn(ret)) return [];

  const returnTotals = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options).child(5).name();
  const returnLines = ret.find(`//tns:${returnTotals.slice(0, -5)}ReturnLine`, options);
  return returnLines.map(line => {
    const startDate = getText(line, 'tns:Date');
    const freq = getReturnFrequency(ret);
    return {
      startDate: startDate,
      endDate: getEndDate(startDate, freq),
      quantity: getText(line, 'tns:AbstractedVolume'),
      timePeriod: freq,
      readingType: getReadingType(line)
    };
  });
};

const getEndDate = (startDate, freq) => {
  switch (freq) {
    case 'day':
      return startDate;
    case 'week':
      return moment(startDate).add(6, 'days').format('YYYY-MM-DD');
    case 'month':
      return moment(startDate).endOf('month').format('YYYY-MM-DD');
    case 'year':
      return moment(startDate).add(1, 'years').subtract(1, 'days').format('YYYY-MM-DD');
  }
};

const getReadingType = (returnLine) => {
  const readingType = getText(returnLine, 'tns:EstimatedIndicator');
  return readingType === 'N' ? 'measured' : 'estimated';
};

const getPermitsFromXml = xmlDoc => xmlDoc.find('tns:Permit', options);

const getReturnsFromPermits = (permits, licenceRegionCodes) => {
  return flatMap(permits, permit => {
    const licenceNumber = getText(permit, 'tns:IrPermitNo');
    const returns = permit.find('tns:Return', options);
    return returns.map(ret => {
      ret.licenceNumber = licenceNumber;
      return ret;
    });
  });
};

const getLicencesNumbers = returns => uniq(returns.map(ret => ret.licenceNumber));

const getReturnsIdsFromReturns = returns => returns.map(ret => ret.returnId);

const getXmlReturnSkeleton = () => ({
  isUnderQuery: false,
  version: 1,
  isCurrent: true
});

const getUserType = user => {
  const scopes = get(user, 'role.scopes', []);
  return scopes.includes('external') ? 'external' : 'internal';
};

const mapUser = user => ({
  email: user.user_name,
  type: getUserType(user),
  entityId: user.entity_id
});

const mapXmlReturn = (returnXml, licenceRegionCodes, returnsData, receivedDate, user) => {
  const returnRequirement = getText(returnXml, 'tns:ReturnRequirementId');
  const startDate = getText(returnXml, 'tns:ReturnReportingPeriodStartDate');
  const endDate = getText(returnXml, 'tns:ReturnReportingPeriodEndDate');
  const regionCode = licenceRegionCodes[returnXml.licenceNumber];
  const returnId = getReturnId(regionCode, returnXml.licenceNumber, returnRequirement, startDate, endDate);
  const returnData = returnsData.find(r => r.return_id === returnId);

  return {
    ...getXmlReturnSkeleton(),
    returnId,
    licenceNumber: returnXml.licenceNumber,
    returnRequirement,
    receivedDate,
    startDate,
    endDate,
    dueDate: get(returnData, 'due_date', null),
    frequency: getReturnFrequency(returnXml),
    isNil: getNilReturn(returnXml),
    status: get(returnData, 'status', null),
    reading: getReadingDetails(returnXml),
    meters: getMeterDetails(returnXml),
    lines: getReturnLines(returnXml),
    user: mapUser(user)
  };
};

const mapXml = async (xmlDoc, user, today) => {
  const permits = getPermitsFromXml(xmlDoc);
  const returns = getReturnsFromPermits(permits);
  const returnIds = getReturnsIdsFromReturns(returns);
  const licenceNumbers = getLicencesNumbers(returns);
  const receivedDate = moment(today).format('YYYY-MM-DD');

  // Get the licence region codes and the server data about the returns which
  // will be used to fulfil the required data schema.
  const [licenceRegionCodes, returnsData] = await Promise.all([
    permitConnector.getLicenceRegionCodes(licenceNumbers),
    returnsConnector.getActiveReturns(returnIds)
  ]);

  return returns.map(ret => {
    return mapXmlReturn(ret, licenceRegionCodes, returnsData, receivedDate, user);
  });
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
