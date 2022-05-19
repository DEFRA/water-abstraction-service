'use strict'

const {
  experiment,
  test,
  before,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const reportsConnector = require('../../../src/lib/connectors/reporting/')
const controllers = require('../../../src/modules/reporting/controllers')

experiment('modules/reporting/controllers', () => {
  let request
  before(async () => {
    await sandbox.stub(reportsConnector, 'getReport').resolves()
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReport', () => {
    request = {
      defra: {
        internalCallingUser: {
          id: 1010
        }
      },
      params: {
        reportIdentifier: 'testreport'
      }
    }
    before(async () => {
      await controllers.getReport(request)
    })

    test('calls the reports connector', async () => {
      expect(reportsConnector.getReport.calledWith(1010, 'testreport')).to.be.true()
    })
  })
})
