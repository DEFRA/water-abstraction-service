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
const ChargeVersionWorkflow = require('../../../../src/lib/connectors/bookshelf/ChargeVersionWorkflow.js')
const chargeVersionWorkflowsRepo = require('../../../../src/lib/connectors/repos/charge-version-workflows')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/charge-version-workflows', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne')
    sandbox.stub(helpers, 'findMany')
    sandbox.stub(helpers, 'create')
    sandbox.stub(helpers, 'update')
    sandbox.stub(helpers, 'deleteOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findOne', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.findOne('test-id')
    })

    test('delegates to the findOne helper', async () => {
      const [model, idKey, idValue, relatedModels] = helpers.findOne.lastCall.args
      expect(model).to.equal(ChargeVersionWorkflow)
      expect(idKey).to.equal('chargeVersionWorkflowId')
      expect(idValue).to.equal('test-id')
      expect(relatedModels).to.equal([
        'licence',
        'licence.region',
        'licenceVersion'
      ])
    })
  })

  experiment('.findAll', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.findAll()
    })

    test('delegates to the findMany helper', async () => {
      const [model, conditions, relatedModels] = helpers.findMany.lastCall.args
      expect(model).to.equal(ChargeVersionWorkflow)
      expect(conditions).to.equal({ date_deleted: null })
      expect(relatedModels).to.equal([
        'licence',
        'licence.region',
        'licenceVersion'
      ])
    })
  })

  experiment('.findManyForLicence', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.findManyForLicence('test-licence-id')
    })

    test('delegates to the findMany helper', async () => {
      const [model, conditions, relatedModels] = helpers.findMany.lastCall.args
      expect(model).to.equal(ChargeVersionWorkflow)
      expect(conditions).to.equal({ licence_id: 'test-licence-id', date_deleted: null })
      expect(relatedModels).to.equal([
        'licence',
        'licence.region',
        'licenceVersion'
      ])
    })
  })

  experiment('.create', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.create({
        foo: 'bar'
      })
    })

    test('delegates to the create helper', async () => {
      const [model, data] = helpers.create.lastCall.args
      expect(model).to.equal(ChargeVersionWorkflow)
      expect(data).to.equal({ foo: 'bar' })
    })
  })

  experiment('.update', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.update('test-id', {
        foo: 'bar'
      })
    })

    test('delegates to the update helper', async () => {
      expect(helpers.update.calledWith(
        ChargeVersionWorkflow, 'chargeVersionWorkflowId', 'test-id', { foo: 'bar' }
      )).to.be.true()
    })
  })

  experiment('.deleteOne', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.deleteOne('test-id')
    })

    test('delegates to the delete helper', async () => {
      const args = helpers.deleteOne.lastCall.args
      expect(args[0]).to.equal(ChargeVersionWorkflow)
      expect(args[1]).to.equal('chargeVersionWorkflowId')
      expect(args[2]).to.equal('test-id')
    })
  })

  experiment('.softDeleteOne', () => {
    beforeEach(async () => {
      await chargeVersionWorkflowsRepo.softDeleteOne('test-id')
    })

    test('delegates to the update helper', async () => {
      const args = helpers.update.lastCall.args
      expect(args[0]).to.equal(ChargeVersionWorkflow)
      expect(args[1]).to.equal('chargeVersionWorkflowId')
      expect(args[2]).to.equal('test-id')
      expect(Object.keys(args[3])[0]).to.equal('dateDeleted')
    })
  })
})
