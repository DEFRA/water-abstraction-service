'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const applicationStateService = require('../../../src/lib/services/application-state')
const controller = require('../../../src/modules/application-state/controller')

experiment('modules/application-state/controller', () => {
  beforeEach(async () => {
    sandbox.stub(applicationStateService, 'save')
    sandbox.stub(applicationStateService, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getApplicationState', () => {
    let request

    beforeEach(async () => {
      request = {
        params: { key: 'test-key' }
      }
    })

    test('fetches the data via the service using the key', async () => {
      await controller.getApplicationState(request)
      const [serviceKey] = applicationStateService.get.lastCall.args

      expect(serviceKey).to.equal(request.params.key)
    })

    test('returns the data', async () => {
      applicationStateService.get.resolves({
        id: 'test-data'
      })

      const state = await controller.getApplicationState(request)

      expect(state.id).to.equal('test-data')
    })

    test('returns a not found error if no data found', async () => {
      applicationStateService.get.resolves()

      const state = await controller.getApplicationState(request)

      expect(state.output.payload.message).to.equal('No application state for key: test-key')
    })
  })

  experiment('.postApplicationState', () => {
    let request

    beforeEach(async () => {
      request = {
        params: { key: 'new-key' },
        payload: { one: 1, two: 2 }
      }

      await controller.postApplicationState(request)
    })

    test('saves the data via the service using the key and payload', async () => {
      const [key, data] = applicationStateService.save.lastCall.args
      expect(key).to.equal(request.params.key)
      expect(data).to.equal(request.payload)
    })

    test('returns the entity', async () => {
      const [key, data] = applicationStateService.save.lastCall.args
      expect(key).to.equal(request.params.key)
      expect(data).to.equal(request.payload)
    })
  })
})
