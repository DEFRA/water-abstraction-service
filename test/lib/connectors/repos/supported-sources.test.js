'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const uuid = require('uuid/v4')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { SupportedSource } = require('../../../../src/lib/connectors/bookshelf')
const repo = require('../../../../src/lib/connectors/repos/supported-sources')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/supported-sources', () => {
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
        SupportedSource,
        data
      ))
    })
  })

  experiment('.findAll', () => {
    test('delegates to helpers.findMany', async () => {
      await repo.findAll()
      expect(helpers.findMany.calledWith(
        SupportedSource
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
