const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { logger } = require('../../../src/logger')
const controller = require('../../../src/modules/ar-analysis/controller')
const updateLicence = require('../../../src/modules/ar-analysis/lib/update-licence-row')

experiment('controller', () => {
  let request

  beforeEach(async () => {
    sandbox.stub(updateLicence, 'updateLicenceRow')
    sandbox.stub(logger, 'error')

    request = {
      params: { licenceRef: '123' }
    }
  })

  afterEach(async () => sandbox.restore())

  test('returns the update result', async () => {
    const updateRowResult = { test: 'ok' }
    updateLicence.updateLicenceRow.resolves(updateRowResult)
    const response = await controller.getUpdateLicence(request)
    expect(response).to.equal(updateRowResult)
  })

  experiment('when updateLicenceRow errors', () => {
    const err = new Error('Opps')
    beforeEach(async () => {
      updateLicence.updateLicenceRow.rejects(err)
    })

    afterEach(async () => sandbox.restore())

    test('the error is logged', async () => {
      try {
        await controller.getUpdateLicence(request)
      } catch (e) {
        const [message, error, params] = logger.error.lastCall.args
        expect(message).to.equal('Failed to update AR licence')
        expect(error).to.equal(err.stack)
        expect(params.licenceRef).to.equal('123')
      }
    })

    test('a 500 error is thrown', async () => {
      try {
        await controller.getUpdateLicence(request)
      } catch (e) {
        expect(e.isBoom).to.be.true()
        expect(e.output.payload.statusCode).to.equal(500)
      }
    })
  })
})
