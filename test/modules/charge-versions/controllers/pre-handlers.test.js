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

const chargeVersionWorkflowService = require('../../../../src/modules/charge-versions/services/charge-version-workflows')
const preHandlers = require('../../../../src/modules/charge-versions/controllers/pre-handlers')
const ChargeVersionWorkflow = require('../../../../src/lib/models/charge-version-workflow')

experiment('modules/charge-versions/controllers/pre-handlers', () => {
  let chargeVersionWorkflow

  beforeEach(async () => {
    chargeVersionWorkflow = new ChargeVersionWorkflow()
    chargeVersionWorkflow.fromHash({
      id: '7bfdb410-8fe2-41df-bb3a-e85984112f3b',
      status: 'review'
    })

    sandbox.stub(chargeVersionWorkflowService, 'getById').resolves(chargeVersionWorkflow)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.loadChargeVersionWorkflow', () => {
    let request

    beforeEach(async () => {
      request = {
        params: {
          chargeVersionWorkflowId: 'test-charge-version-workflow-id'
        }
      }
    })

    experiment('when the charge version workflow is not found', () => {
      test('a not found error is returned', async () => {
        chargeVersionWorkflowService.getById.resolves(null)

        const result = await preHandlers.loadChargeVersionWorkflow(request)
        const { statusCode, message } = result.output.payload

        expect(statusCode).to.equal(404)
        expect(message).to.equal('No charge version workflow found with id: test-charge-version-workflow-id')
      })
    })

    experiment('when the charge version workflow is found', () => {
      let result
      beforeEach(async () => {
        result = await preHandlers.loadChargeVersionWorkflow(request)
      })

      test('calls the charge version workflow service with the id', async () => {
        const [id] = chargeVersionWorkflowService.getById.lastCall.args
        expect(id).to.equal(request.params.chargeVersionWorkflowId)
      })

      test('it is returned from the function', async () => {
        expect(result).to.equal(chargeVersionWorkflow)
      })
    })
  })
})
