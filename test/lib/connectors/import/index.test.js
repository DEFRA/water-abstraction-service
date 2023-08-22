'use strict'

const sandbox = require('sinon').createSandbox()
const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const importConnector = require('../../../../src/lib/connectors/import')

experiment('connectors/import', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({
      version: '0.0.1'
    })
    sandbox.stub(serviceRequest, 'post')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getServiceVersion', () => {
    test('calls the expected URL', async () => {
      await importConnector.getServiceVersion()
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.endWith('/health/info')
    })
  })

  experiment('.postImportChargeVersions', () => {
    test('calls the expected URL', async () => {
      await importConnector.postImportChargeVersions()
      const [url] = serviceRequest.post.lastCall.args
      expect(url).to.endWith('/import/1.0/charging')
    })
  })
})
