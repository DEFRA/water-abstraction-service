'use strict'

const sandbox = require('sinon').createSandbox()
const got = require('got')
const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const reportingConnector = require('../../../../src/lib/connectors/reporting')

experiment('connectors/import', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({
      version: '0.0.1'
    })
    sandbox.stub(got, 'stream')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReport', () => {
    test('calls the expected URL', async () => {
      await reportingConnector.getReport('5050', 'SomeReport')
      const [url] = got.stream.lastCall.args
      expect(url).to.endWith('/report/SomeReport')
    })

    test('calls the got.stream module function', async () => {
      await reportingConnector.getReport('5050', 'SomeReport')
      expect(got.stream.called).to.be.true()
    })
  })
})
