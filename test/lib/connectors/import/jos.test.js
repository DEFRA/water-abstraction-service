'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const jobsConnector = require('../../../../src/lib/connectors/import/jobs')
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

experiment('lib/connectors/import/jobs', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'import').value('http://test.defra')
    sandbox.stub(serviceRequest, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getSummary', () => {
    let response

    beforeEach(async () => {
      serviceRequest.get.resolves([
        { name: 'job-name', state: 'completed', count: 10 }
      ])

      response = await jobsConnector.getSummary()
    })

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://test.defra/jobs/summary')
    })

    test('returns the result from the import service', async () => {
      expect(response).to.equal([
        { name: 'job-name', state: 'completed', count: 10 }
      ])
    })
  })
})
