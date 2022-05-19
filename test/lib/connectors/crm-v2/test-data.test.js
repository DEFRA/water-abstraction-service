'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const testDataConnector = require('../../../../src/lib/connectors/crm-v2/test-data')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

experiment('lib/connectors/crm-v2/test-data', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra')
    sandbox.stub(serviceRequest, 'delete')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.deleteTestData', () => {
    beforeEach(async () => {
      await testDataConnector.deleteTestData()

      test('makes a delete request to the expected URL', async () => {
        const [url] = serviceRequest.delete.lastCall.args
        expect(url).to.equal('http://test.defra/test-data')
      })
    })
  })
})
