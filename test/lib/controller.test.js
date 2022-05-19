'use strict'

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script()

const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const controller = require('../../src/lib/controller')

experiment('lib/controller', () => {
  experiment('getEntity', () => {
    experiment('when the entity is found', () => {
      let result
      let id
      let serviceFunc
      let testEntity

      beforeEach(async () => {
        testEntity = { id: 'test-id' }
        id = 'test-id'
        serviceFunc = sandbox.stub().resolves(testEntity)

        result = await controller.getEntity(id, serviceFunc)
      })

      test('the service func is called with the id', async () => {
        const [passedId] = serviceFunc.lastCall.args
        expect(passedId).to.equal(id)
      })

      test('it is returned', async () => {
        expect(result).to.equal(testEntity)
      })
    })

    experiment('when the entity is not found', () => {
      let result
      let id
      let serviceFunc

      beforeEach(async () => {
        id = 'test-id'
        serviceFunc = sandbox.stub().resolves(null)

        result = await controller.getEntity(id, serviceFunc)
      })

      test('the service func is called with the id', async () => {
        const [passedId] = serviceFunc.lastCall.args
        expect(passedId).to.equal(id)
      })

      test('a boom error is returned', async () => {
        expect(result.isBoom).to.equal(true)
        expect(result.output.payload.message).to.equal('Entity test-id not found')
        expect(result.output.statusCode).to.equal(404)
      })
    })
  })

  experiment('getEntities', () => {
    let result
    let id
    let serviceFunc
    let testEntities
    let mapper

    beforeEach(async () => {
      testEntities = [{ id: 'test-id' }]
      id = 'test-id'
      serviceFunc = sandbox.stub().resolves(testEntities)
    })

    experiment('when a mapper is not used', () => {
      beforeEach(async () => {
        result = await controller.getEntities(id, serviceFunc)
      })

      test('the service func is called with the id', async () => {
        const [passedId] = serviceFunc.lastCall.args
        expect(passedId).to.equal(id)
      })

      test('it is returned', async () => {
        expect(result).to.equal({
          data: testEntities
        })
      })
    })

    experiment('when a mapper is used', () => {
      beforeEach(async () => {
        mapper = row => ({ id: row.id + '-mapped' })
        result = await controller.getEntities(id, serviceFunc, mapper)
      })

      test('the service func is called with the id', async () => {
        const [passedId] = serviceFunc.lastCall.args
        expect(passedId).to.equal(id)
      })

      test('the results are mapped', async () => {
        expect(result).to.equal({
          data: [{ id: 'test-id-mapped' }]
        })
      })
    })
  })
})
