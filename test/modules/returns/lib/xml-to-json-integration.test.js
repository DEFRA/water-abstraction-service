/**
 * Integration test to ensure the output of the XML to
 * JSON mapper outputs JSON that validates against the
 * returns model schema.
 */

const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()
const { mapXml } = require('../../../../src/modules/returns/lib/xml-adapter/mapper')
const path = require('path')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)

const permitConnector = require('../../../../src/lib/connectors/permit')
const returnsConnector = require('../../../../src/lib/connectors/returns')

const getTestFile = async name => {
  return readFile(path.join(__dirname, './xml-files-for-tests', name + '.xml'), 'utf-8')
}

const getTestUser = () => ({
  user_name: 'upload@example.com',
  role: {
    scopes: ['external']
  },
  external_id: '00000000-0000-0000-0000-000000000000',
  reset_required: 0
})

const { returnSchema } = require('../../../../src/modules/returns/schema')

const stubReturn = (licenceNumber, returnReference) => {
  const ret = {
    licence_ref: licenceNumber,
    due_date: '2020-01-01',
    return_id: `v1:1:${licenceNumber}:${returnReference}:2017-04-01:2018-03-31`,
    status: 'due'
  }

  sandbox
    .stub(returnsConnector.returns, 'findAll')
    .resolves([ret])
}

experiment('mapXml output validates the return model schema', () => {
  const licenceRegionCodes = {
    '123abc': 1,
    '03/28/22/0070': 1,
    '03/79/22/1230': 1
  }
  const today = '2019-01-01'

  beforeEach(async () => {
    sandbox.stub(permitConnector, 'getLicenceRegionCodes').resolves(licenceRegionCodes)
  })

  afterEach(async () => sandbox.restore())

  test('single yearly return passes schema validation', async () => {
    stubReturn('123abc', '1111')
    const file = await getTestFile('single-yearly-return')
    const returns = await mapXml(file, getTestUser(), today)

    returns.forEach(ret => {
      const result = returnSchema.validate(ret)
      expect(result.error).to.be.undefined()
    })
  })

  test('estimated monthly return passes schema validation', async () => {
    stubReturn('03/28/22/0070', '14939112')
    const file = await getTestFile('estimated-monthly-return')
    const returns = await mapXml(file, getTestUser(), today)

    returns.forEach(ret => {
      const result = returnSchema.validate(ret)
      expect(result.error).to.be.undefined()
    })
  })

  test('nil return return passes schema validation', async () => {
    stubReturn('03/79/22/1230', '10083015')
    const file = await getTestFile('nil-return')
    const returns = await mapXml(file, getTestUser(), today)

    returns.forEach(ret => {
      const result = returnSchema.validate(ret)
      expect(result.error).to.be.undefined()
    })
  })
})
