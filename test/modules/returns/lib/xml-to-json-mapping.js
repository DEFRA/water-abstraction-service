const { expect } = require('code');
const { beforeEach, experiment, test } = exports.lab = require('lab').script();
const { parseXmlFile } = require('../../../../src/modules/returns/lib/xml-helpers');
const {
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
} = require('../../../../src/modules/returns/lib/xml-to-json-mapping');
const path = require('path');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

experiment('XML to JSON Mapping', () => {
  let returnXml;
  let returnXmlNode;
  let xmlFileToParse;

  experiment('Completed Return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-monthly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test('getNilReturn function returns false', () => {
      let xmlReturn = getNilReturn(returnXmlNode);

      expect(xmlReturn).to.be.a.boolean().and.to.be.false();
    });

    test('mapXml returns an object with the relevant licence headers', () => {
      let returnsArray = mapXml(returnXml);

      expect(returnsArray).to.be.an.array().and.to.not.be.empty();
      expect(returnsArray[0]).to.contain(['licenceNumber', 'returnRequirement',
        'receivedDate', 'startDate', 'endDate', 'frequency', 'isNil', 'reading',
        'meters', 'lines']);
    });
  });

  experiment('Nil Return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/nil-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test('Return frequency returns null', async () => {
      let returnFrequency = getReturnFrequency(returnXmlNode);

      expect(returnFrequency).to.be.null();
    });

    test('getNilReturn function returns true', () => {
      let nilReturn = getNilReturn(returnXmlNode);

      expect(nilReturn).to.be.a.boolean().and.to.be.true();
    });

    test('getMeterDetails returns "[]"', () => {
      let meterDetails = getMeterDetails(returnXmlNode);

      expect(meterDetails).to.be.an.array().and.to.be.empty();
    });

    test('getReadingDetails returns "{}"', () => {
      let readingDetails = getReadingDetails(returnXmlNode);

      expect(readingDetails).to.be.an.object().and.to.be.empty();
    });

    test('getReturnLines returns an object', () => {
      let returnLines = getReturnLines(returnXmlNode);

      expect(returnLines).to.be.an.array().and.to.be.empty();
    });
  });

  experiment('Daily return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/daily-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test("returns 'day' for Daily return", async () => {
      let returnFrequency = getReturnFrequency(returnXmlNode);

      expect(returnFrequency).to.equal('day');
    });
  });

  experiment('Weekly Return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-weekly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test("returns 'week' for Weekly return", async () => {
      let returnFrequency = getReturnFrequency(returnXmlNode);

      expect(returnFrequency).to.equal('week');
    });
  });

  experiment('Monthly Return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-monthly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test("returns 'month' for Monthly return", async () => {
      let returnFrequency = getReturnFrequency(returnXmlNode);

      expect(returnFrequency).to.equal('month');
    });
  });

  experiment('Yearly Return', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-yearly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test("returns 'year' for Yearly return", async () => {
      let returnFrequency = getReturnFrequency(returnXmlNode);

      expect(returnFrequency).to.equal('year');
    });
  });

  experiment('Return Lines', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-yearly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test('getReturnLines returns an object', () => {
      let returnLines = getReturnLines(returnXmlNode);

      expect(returnLines).to.be.an.array().and.to.have.length(1);
      expect(returnLines[0]).to.contain(['startDate', 'endDate', 'quantity', 'timePeriod', 'readingType']);
    });

    test('getReadingType returns "measured" if EstimatedIndicator ="N"', () => {
      let returnLine = returnXmlNode.get('//tns:YearlyReturnLine', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
      let returnReadingType = getReadingType(returnLine);

      expect(returnReadingType).to.equal('measured');
    });

    test('getReadingType returns "estimated" if EstimatedIndicator ="Y"', async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/estimated-monthly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      let returnLine = returnXml.get('//tns:MonthlyReturnLine', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
      let returnReadingType = getReadingType(returnLine);

      expect(returnReadingType).to.equal('estimated');
    });
  });

  experiment('Meter Usage', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/single-monthly-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
      returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
    });

    test('getMeterDetails returns a meter object', () => {
      let meterDetails = getMeterDetails(returnXmlNode);

      expect(meterDetails).to.be.an.array().and.to.have.length(1);
      expect(meterDetails[0]).to.be.an.object().and.contain(['units', 'manufacturer', 'serialNumber']);
    });

    test('getReadingDetails returns a reading object', () => {
      let readingDetails = getReadingDetails(returnXmlNode);

      expect(readingDetails).to.be.an.object().and.contain(['type', 'method', 'units']);
    });

    experiment('WasMeterUsed = "Y"', () => {
      test('wasMeterUsed returns true', () => {
        let meterUsage = returnXmlNode.get('//tns:MeterUsage', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
        let meterUsed = wasMeterUsed(meterUsage);

        expect(meterUsed).to.be.a.boolean().and.to.be.true();
      });

      test('getOverallReadingType to return "measured"', () => {
        let overallReadingType = getOverallReadingType(returnXmlNode);

        expect(overallReadingType).to.equal('measured');
      });

      test('getUnits returns "m³" when UnitOfMeasurement is "CubicMetres"', () => {
        let units = getUnits(returnXmlNode);

        expect(units).to.equal('m³');
      });
    });

    experiment('WasMeterUsed = "N"', () => {
      beforeEach(async () => {
        xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/estimated-monthly-return.xml'), 'utf-8');
        returnXml = await parseXmlFile(xmlFileToParse);
        returnXmlNode = returnXml.get('//tns:Return', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
      });

      test('wasMeterUsed returns false', () => {
        let meterUsage = returnXmlNode.get('//tns:MeterUsage', { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' });
        let meterUsed = wasMeterUsed(meterUsage);

        expect(meterUsed).to.be.a.boolean().and.to.be.false();
      });

      test('getOverallReadingType to return "estimated"', () => {
        let overallReadingType = getOverallReadingType(returnXmlNode);

        expect(overallReadingType).to.equal('estimated');
      });

      test('getMeterDetails returns "[]"', () => {
        let meterDetails = getMeterDetails(returnXmlNode);

        expect(meterDetails).to.be.an.array().and.to.be.empty();
      });

      test('getUnits returns "null" when UnitOfMeasurement is not "CubicMetres"', () => {
        let units = getUnits(returnXmlNode);

        expect(units).to.equal(null);
      });
    });
  });

  experiment('Multiple Licences', () => {
    beforeEach(async () => {
      xmlFileToParse = await readFile(path.join(__dirname, './xml-files-for-tests/daily-return.xml'), 'utf-8');
      returnXml = await parseXmlFile(xmlFileToParse);
    });

    test('gets correct licence number when there are multiple licences', () => {
      let returnsArray = mapXml(returnXml);

      expect(returnsArray[0].licenceNumber).to.equal('55/33/12/1224');
      expect(returnsArray[1].licenceNumber).to.equal('74/30/19/8731');
    });
  });

  experiment('endDate calculations', () => {
    test('returns startDate when freq="day"', () => {
      let endDate = getEndDate('2019-01-01', 'day');

      expect(endDate).to.equal('2019-01-01');
    });

    test('returns startDate + 6 days when freq="week"', () => {
      let endDate = getEndDate('2019-01-01', 'week');

      expect(endDate).to.equal('2019-01-07');
    });

    test('returns last day of the month when freq="month"', () => {
      let endDate = getEndDate('2019-01-01', 'month');

      expect(endDate).to.equal('2019-01-31');
    });

    test('returns startDate + 1 year when freq="year"', () => {
      let endDate = getEndDate('2019-01-01', 'year');

      expect(endDate).to.equal('2019-12-31');
    });
  });
});
