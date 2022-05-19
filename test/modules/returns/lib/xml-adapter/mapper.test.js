'use strict'

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

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
} = require('../../../../../src/modules/returns/lib/xml-adapter/mapper')

const path = require('path')
const fs = require('fs')
const util = require('util')
const libxmljs = require('libxmljs')

const readFile = util.promisify(fs.readFile)

const permitConnector = require('../../../../../src/lib/connectors/permit')
const returnsConnector = require('../../../../../src/lib/connectors/returns')

const getTestFile = name => {
  return readFile(path.join(__dirname, '../xml-files-for-tests', name + '.xml'), 'utf-8')
}

const getNode = (document, xpath) => {
  const options = { tns: 'http://www.environment-agency.gov.uk/XMLSchemas/GOR/SAPMultiReturn/06' }
  return document.get(xpath, options)
}

const getTestUser = () => ({
  user_name: 'upload@example.com',
  role: {
    scopes: ['external']
  },
  external_id: '1234-4321',
  reset_required: 0
})

experiment('XML to JSON Mapping', () => {
  let returnXml
  let returnXmlNode

  experiment('Completed Return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-monthly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')

      const licenceRegionCodes = {
        '123abc': 1
      }

      sandbox.stub(permitConnector, 'getLicenceRegionCodes').resolves(licenceRegionCodes)
      sandbox.stub(returnsConnector.returns, 'findAll').resolves([
        {
          licence_ref: '123abc',
          due_date: '2020-01-01',
          return_id: 'v1:1:123abc:1111:2017-04-01:2018-03-31',
          status: 'due'
        }
      ])
    })

    afterEach(async () => sandbox.restore())

    test('getNilReturn function returns false', async () => {
      const xmlReturn = getNilReturn(returnXmlNode)
      expect(xmlReturn).to.be.false()
    })

    test('mapXml returns an object with the relevant licence headers', async () => {
      const returnsArray = await mapXml(returnXml, getTestUser())

      expect(returnsArray).to.be.an.array().and.to.not.be.empty()
      expect(returnsArray[0]).to.contain(['licenceNumber',
        'receivedDate', 'startDate', 'endDate', 'frequency', 'isNil', 'reading',
        'meters', 'lines'])
    })
  })

  experiment('Nil Return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('nil-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    afterEach(async () => sandbox.restore())

    test('Return frequency returns null', async () => {
      const returnFrequency = getReturnFrequency(returnXmlNode)
      expect(returnFrequency).to.be.null()
    })

    test('getNilReturn function returns true', () => {
      const nilReturn = getNilReturn(returnXmlNode)
      expect(nilReturn).to.be.a.boolean().and.to.be.true()
    })

    test('getMeterDetails returns "[]"', () => {
      const meterDetails = getMeterDetails(returnXmlNode)
      expect(meterDetails).to.be.an.array().and.to.be.empty()
    })

    test('getReadingDetails returns "{}"', () => {
      const readingDetails = getReadingDetails(returnXmlNode)
      expect(readingDetails).to.be.an.object().and.to.be.empty()
    })

    test('getReturnLines returns an object', () => {
      const returnLines = getReturnLines(returnXmlNode)

      expect(returnLines).to.be.an.array().and.to.be.empty()
    })
  })

  experiment('Daily return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('daily-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    test("returns 'day' for Daily return", async () => {
      const returnFrequency = getReturnFrequency(returnXmlNode)
      expect(returnFrequency).to.equal('day')
    })
  })

  experiment('Weekly Return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-weekly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    test("returns 'week' for Weekly return", async () => {
      const returnFrequency = getReturnFrequency(returnXmlNode)
      expect(returnFrequency).to.equal('week')
    })
  })

  experiment('Monthly Return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-monthly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    test("returns 'month' for Monthly return", async () => {
      const returnFrequency = getReturnFrequency(returnXmlNode)
      expect(returnFrequency).to.equal('month')
    })
  })

  experiment('Yearly Return', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-yearly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    test("returns 'year' for Yearly return", async () => {
      const returnFrequency = getReturnFrequency(returnXmlNode)
      expect(returnFrequency).to.equal('year')
    })
  })

  experiment('Return Lines', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-yearly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
      sandbox.stub(permitConnector, 'getLicenceRegionCodes').resolves({ '123abc': 1 })
      sandbox.stub(returnsConnector.returns, 'findAll').resolves([
        {
          licence_ref: '123abc',
          due_date: '2020-01-01',
          return_id: 'v1:1:123abc:1111:2017-04-01:2018-03-31',
          status: 'due'
        }
      ])
    })

    afterEach(async () => sandbox.restore())

    test('getReturnLines returns an object', async () => {
      const returnLines = getReturnLines(returnXmlNode)

      expect(returnLines).to.be.an.array().and.to.have.length(1)
      expect(returnLines[0]).to.contain(['startDate', 'endDate', 'quantity', 'timePeriod', 'readingType'])
    })

    test('getReadingType returns "measured" if EstimatedIndicator ="N"', async () => {
      const returnLine = getNode(returnXmlNode, '//tns:YearlyReturnLine')
      const returnReadingType = getReadingType(returnLine)

      expect(returnReadingType).to.equal('measured')
    })

    test('getReadingType returns "estimated" if EstimatedIndicator ="Y"', async () => {
      const xmlFileToParse = await getTestFile('estimated-monthly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      const returnLine = getNode(returnXml, '//tns:MonthlyReturnLine')
      const returnReadingType = getReadingType(returnLine)

      expect(returnReadingType).to.equal('estimated')
    })
  })

  experiment('Meter Usage', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('single-monthly-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      returnXmlNode = getNode(returnXml, '//tns:Return')
    })

    test('getMeterDetails returns a meter object', () => {
      const meterDetails = getMeterDetails(returnXmlNode)
      expect(meterDetails).to.be.an.array().and.to.have.length(1)
      expect(meterDetails[0]).to.be.an.object().and.only.contain(['meterDetailsProvided', 'manufacturer', 'serialNumber', 'multiplier'])
    })

    test('getReadingDetails returns a reading object', () => {
      const readingDetails = getReadingDetails(returnXmlNode)
      expect(readingDetails).to.be.an.object().and.contain(['type', 'method', 'units'])
    })

    experiment('WasMeterUsed = "Y"', () => {
      test('wasMeterUsed returns true', () => {
        const meterUsage = getNode(returnXmlNode, '//tns:MeterUsage')
        const meterUsed = wasMeterUsed(meterUsage)

        expect(meterUsed).to.be.a.boolean().and.to.be.true()
      })

      test('getOverallReadingType to return "measured"', () => {
        const overallReadingType = getOverallReadingType(returnXmlNode)
        expect(overallReadingType).to.equal('measured')
      })

      test('getUnits returns "m³" when UnitOfMeasurement is "CubicMetres"', () => {
        const units = getUnits(returnXmlNode)
        expect(units).to.equal('m³')
      })
    })

    experiment('WasMeterUsed = "N"', () => {
      beforeEach(async () => {
        const xmlFileToParse = await getTestFile('estimated-monthly-return')
        returnXml = await libxmljs.parseXml(xmlFileToParse)
        returnXmlNode = getNode(returnXml, '//tns:Return')
      })

      test('wasMeterUsed returns false', () => {
        const meterUsage = getNode(returnXmlNode, '//tns:MeterUsage')
        const meterUsed = wasMeterUsed(meterUsage)

        expect(meterUsed).to.be.a.boolean().and.to.be.false()
      })

      test('getOverallReadingType to return "estimated"', () => {
        const overallReadingType = getOverallReadingType(returnXmlNode)
        expect(overallReadingType).to.equal('estimated')
      })

      test('getMeterDetails returns "[]"', () => {
        const meterDetails = getMeterDetails(returnXmlNode)
        expect(meterDetails).to.be.an.array().and.to.be.empty()
      })

      test('getUnits return the expected value', () => {
        const units = getUnits(returnXmlNode)
        expect(units).to.equal('m³')
      })

      test('getUnits returns "null" when UnitOfMeasurement is not "CubicMetres"', async () => {
        const xmlFileToParse = await getTestFile('estimated-monthly-return')
        const noUnitOfMeasurementXml = xmlFileToParse.replace('<tns:UnitOfMeasurement>CubicMetres</tns:UnitOfMeasurement>', '<tns:UnitOfMeasurement></tns:UnitOfMeasurement>')
        returnXml = await libxmljs.parseXml(noUnitOfMeasurementXml)
        returnXmlNode = getNode(returnXml, '//tns:Return')

        const units = getUnits(returnXmlNode)
        expect(units).to.equal(null)
      })
    })
  })

  experiment('Multiple Licences', () => {
    beforeEach(async () => {
      const xmlFileToParse = await getTestFile('daily-return')
      returnXml = await libxmljs.parseXml(xmlFileToParse)
      const licenceRegionCodes = {
        '111aaa': 1,
        '222bbb': 2
      }

      sandbox.stub(permitConnector, 'getLicenceRegionCodes').resolves(licenceRegionCodes)
      sandbox.stub(returnsConnector.returns, 'findAll').resolves([
        {
          licence_ref: '111aaa',
          due_date: '2020-01-01',
          return_id: 'v1:1:111aaa:1111:2017-04-01:2018-03-31',
          status: 'due'
        },
        {
          licence_ref: '222bbb',
          due_date: '2020-01-01',
          return_id: 'v1:2:222bbb:2222:2017-04-01:2018-03-31',
          status: 'due'
        }
      ])
    })

    afterEach(async () => sandbox.restore())

    test('gets correct licence number when there are multiple licences', async () => {
      const returnsArray = await mapXml(returnXml, getTestUser())

      expect(returnsArray[0].licenceNumber).to.equal('111aaa')
      expect(returnsArray[1].licenceNumber).to.equal('222bbb')
    })
  })

  experiment('endDate calculations', () => {
    test('returns startDate when freq="day"', () => {
      const endDate = getEndDate('2019-01-01', 'day')
      expect(endDate).to.equal('2019-01-01')
    })

    test('returns the end of the week when freq="week" (weeks end on Saturday)', () => {
      const endDate = getEndDate('2019-01-01', 'week')
      expect(endDate).to.equal('2019-01-05')
    })

    test('returns last day of the month when freq="month"', () => {
      const endDate = getEndDate('2019-01-01', 'month')
      expect(endDate).to.equal('2019-01-31')
    })

    test('returns startDate + 1 year when freq="year"', () => {
      const endDate = getEndDate('2019-01-01', 'year')
      expect(endDate).to.equal('2019-12-31')
    })
  })
})

experiment('mapXml', () => {
  const licenceRegionCodes = {
    '123abc': 1
  }
  let mappedReturn
  const today = '2019-01-01'

  beforeEach(async () => {
    const file = await getTestFile('single-yearly-return')
    const parsed = await libxmljs.parseXml(file)
    sandbox.stub(permitConnector, 'getLicenceRegionCodes').resolves(licenceRegionCodes)
    sandbox.stub(returnsConnector.returns, 'findAll').resolves([
      {
        licence_ref: '123abc',
        due_date: '2020-01-01',
        return_id: 'v1:1:123abc:1111:2017-04-01:2018-03-31',
        status: 'due'
      }
    ]);

    [mappedReturn] = await mapXml(parsed, getTestUser(), today)
  })

  afterEach(async () => sandbox.restore())

  test('adds the return id', async () => {
    expect(mappedReturn.returnId).to.equal('v1:1:123abc:1111:2017-04-01:2018-03-31')
  })

  test('adds the licenceNumber', async () => {
    expect(mappedReturn.licenceNumber).to.equal('123abc')
  })

  test('adds the receivedDate', async () => {
    expect(mappedReturn.receivedDate).to.equal(today)
  })

  test('adds the startDate', async () => {
    expect(mappedReturn.startDate).to.equal('2017-04-01')
  })

  test('adds the endDate', async () => {
    expect(mappedReturn.endDate).to.equal('2018-03-31')
  })

  test('adds the dueDate', async () => {
    expect(mappedReturn.dueDate).to.equal('2020-01-01')
  })

  test('adds the frequency', async () => {
    expect(mappedReturn.frequency).to.equal('year')
  })

  test('adds isNil', async () => {
    expect(mappedReturn.isNil).to.be.false()
  })

  test('always sets the status to completed', async () => {
    expect(mappedReturn.status).to.equal('completed')
  })

  test('sets the version to 1', async () => {
    expect(mappedReturn.versionNumber).to.equal(1)
  })

  test('sets isCurrent to true', async () => {
    expect(mappedReturn.isCurrent).to.be.true()
  })

  test('sets isUnderQuery to false', async () => {
    expect(mappedReturn.isUnderQuery).to.be.false()
  })

  test('adds the user data', async () => {
    expect(mappedReturn.user).to.equal({
      email: 'upload@example.com',
      type: 'external',
      entityId: '1234-4321'
    })
  })
})

experiment('.getMeterDetails', () => {
  experiment('when the meter details contains a meter serial number', () => {
    test('the value is mapped', async () => {
      const xmlFileToParse = await getTestFile('single-yearly-return')
      const returnXml = await libxmljs.parseXml(xmlFileToParse)
      const returnXmlNode = getNode(returnXml, '//tns:Return')

      const meterDetails = getMeterDetails(returnXmlNode)
      expect(meterDetails[0].serialNumber).to.equal('unknown')
    })
  })

  experiment('when the meter details contains a meter serial number', () => {
    test('the value set to a default value', async () => {
      const xmlFileToParse = await getTestFile('single-yearly-return')

      // replace the entire node to simulate its absence
      const withoutSerialNumber = xmlFileToParse.replace('<tns:SerialNumber>unknown</tns:SerialNumber>', '')
      const returnXml = await libxmljs.parseXml(withoutSerialNumber)
      const returnXmlNode = getNode(returnXml, '//tns:Return')

      const meterDetails = getMeterDetails(returnXmlNode)
      expect(meterDetails[0].serialNumber).to.equal('-')
    })
  })
})
