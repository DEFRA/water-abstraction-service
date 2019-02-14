const moment = require('moment');
const { flatMap } = require('lodash');

const options = {
  tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06'
};

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
  const nilReturnStructure = ret.get('tns:GorPart', options).get('tns:NilReturnStructure', options);
  if (nilReturnStructure) {
    return nilReturnStructure.get('tns:IsNilReturn', options).text() === 'yes';
  }
  return false;
};

const getMeterDetails = (ret) => {
  if (getNilReturn(ret)) return [];
  const meterUsage = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options).find('tns:MeterUsage', options);
  return flatMap(meterUsage.map(meter => {
    if (!wasMeterUsed(meter)) return [];
    return {
      units: getUnits(ret),
      manufacturer: meter.get('tns:EaListedManufacturer', options).text(),
      serialNumber: meter.get('tns:SerialNumber', options).text()
    };
  }));
};

const wasMeterUsed = (meterUsage) => {
  return meterUsage.attr('WasMeterUsed').value() === 'Y';
};

const getOverallReadingType = (ret) => {
  const meterUsage = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options).get('tns:MeterUsage', options);
  if (wasMeterUsed(meterUsage)) return 'measured';
  return 'estimated';
};

const getUnits = (ret) => {
  const unitOfMeasurement = ret.get('tns:GorPart', options).get('tns:FullReturnStructure', options).get('tns:UnitOfMeasurement', options).text();
  if (unitOfMeasurement === 'CubicMetres') return 'm³';
  return null;
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
    const startDate = line.get('tns:Date', options).text();
    const freq = getReturnFrequency(ret);
    return {
      startDate: startDate,
      endDate: getEndDate(startDate, freq),
      quantity: line.get('tns:AbstractedVolume', options).text(),
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
  const readingType = returnLine.get('tns:EstimatedIndicator', options).text();
  if (readingType === 'N') return 'measured';
  return 'estimated';
};

const mapXml = (xmlDoc, today) => {
  const permits = xmlDoc.find('tns:Permit', options);

  const returnsArray = permits.map(permit => {
    var returns = permit.find('tns:Return', options);
    return returns.map(ret => {
      return {
        licenceNumber: permit.get('tns:IrPermitNo', options).text(),
        returnRequirement: ret.get('tns:ReturnRequirementId', options).text(),
        receivedDate: moment(today).format('YYYY-MM-DD'),
        startDate: ret.get('tns:ReturnReportingPeriodStartDate', options).text(),
        endDate: ret.get('tns:ReturnReportingPeriodEndDate', options).text(),
        frequency: getReturnFrequency(ret),
        isNil: getNilReturn(ret),
        reading: getReadingDetails(ret),
        meters: getMeterDetails(ret),
        lines: getReturnLines(ret)
      };
    });
  });
  return flatMap(returnsArray);
};

module.exports = {
  getReturnFrequency,
  getNilReturn,
  getMeterDetails,
  wasMeterUsed,
  getOverallReadingType,
  getUnits,
  getReadingDetails,
  getReturnLines,
  getEndDate,
  getReadingType,
  mapXml
};
