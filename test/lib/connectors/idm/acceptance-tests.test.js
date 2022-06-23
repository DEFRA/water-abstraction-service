const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()
const acceptanceTestsConnector = require('../../../../src/lib/connectors/idm/acceptance-tests')
const config = require('../../../../config')

const { serviceRequest } = require('@envage/water-abstraction-helpers')

experiment('connectors/idm/acceptance-tests', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'delete')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.deleteAcceptanceTestData', () => {
    test('uses the expected url', async () => {
      await acceptanceTestsConnector.deleteAcceptanceTestData()
      const [url] = serviceRequest.delete.lastCall.args
      const expected = `${config.services.idm}/acceptance-tests`
      expect(url).to.equal(expected)
    })
  })
})
