const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const config = require('../../../config')

const companiesHouseApi = require('../../../src/lib/connectors/companies-house.js')
const requestPromise = require('../../../src/lib/connectors/external-http')
experiment('lib/connectors/companies-house', () => {
  const apiResponse = { items: [] }

  beforeEach(async () => {
    try {
      sandbox.stub(config.companiesHouse, 'apiKey').value('my_api_key')
      sandbox.stub(requestPromise, 'externalHttp').resolves(apiResponse)
    } catch (err) {
      console.log(err)
    }
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.searchCompanies', () => {
    let result

    beforeEach(async () => {
      result = await companiesHouseApi.searchCompanies('Big Co Ltd', 20, 30)
    })

    test('is a GET call', async () => {
      const [{ method }] = requestPromise.externalHttp.lastCall.args
      expect(method).to.equal('GET')
    })

    test('calls the correct endpoint', async () => {
      const [{ uri }] = requestPromise.externalHttp.lastCall.args
      expect(uri).to.equal('https://api.companieshouse.gov.uk/search/companies')
    })

    test('sets the correct query params', async () => {
      const [{ qs }] = requestPromise.externalHttp.lastCall.args
      expect(qs.q).to.equal('Big Co Ltd')
      expect(qs.start_index).to.equal(20)
      expect(qs.items_per_page).to.equal(30)
    })

    test('expects a JSON response', async () => {
      const [{ json }] = requestPromise.externalHttp.lastCall.args
      expect(json).to.be.true()
    })

    test('sets a base 64 encoded auth header', async () => {
      const [{ headers }] = requestPromise.externalHttp.lastCall.args
      expect(headers.Authorization).to.equal('Basic bXlfYXBpX2tleQ==')
    })

    test('resolves with the API response', async () => {
      expect(result).to.equal(apiResponse)
    })
  })

  experiment('.getCompany', () => {
    let result

    beforeEach(async () => {
      result = await companiesHouseApi.getCompany(123456)
    })

    test('is a GET call', async () => {
      const [{ method }] = requestPromise.externalHttp.lastCall.args
      expect(method).to.equal('GET')
    })

    test('calls the correct endpoint', async () => {
      const [{ uri }] = requestPromise.externalHttp.lastCall.args
      expect(uri).to.equal('https://api.companieshouse.gov.uk/company/123456')
    })

    test('expects a JSON response', async () => {
      const [{ json }] = requestPromise.externalHttp.lastCall.args
      expect(json).to.be.true()
    })

    test('sets a base 64 encoded auth header', async () => {
      const [{ headers }] = requestPromise.externalHttp.lastCall.args
      expect(headers.Authorization).to.equal('Basic bXlfYXBpX2tleQ==')
    })

    test('resolves with the API response', async () => {
      expect(result).to.equal(apiResponse)
    })
  })
})
