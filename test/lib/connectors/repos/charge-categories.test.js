'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const { v4: uuid } = require('uuid')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { ChargeCategory } = require('../../../../src/lib/connectors/bookshelf')
const repo = require('../../../../src/lib/connectors/repos/charge-categories')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/charge-categories', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'create')
    sandbox.stub(helpers, 'findMany')
    sandbox.stub(helpers, 'findOne')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.create', () => {
    const data = { reference: 'crumpets' }

    test('delegates to helpers.update', async () => {
      await repo.create(data)
      expect(helpers.create.calledWith(
        ChargeCategory,
        data
      ))
    })
  })

  experiment('.findAll', () => {
    test('delegates to helpers.findMany', async () => {
      await repo.findAll()
      expect(helpers.findMany.calledWith(
        ChargeCategory
      ))
    })
  })

  experiment('.findOneById', () => {
    test('delegates to helpers.findOne', async () => {
      const tempGuid = uuid()
      await repo.findOneById(tempGuid)
      expect(helpers.findOne.calledWith(
        tempGuid
      ))
    })
  })
})
