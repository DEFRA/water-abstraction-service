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

const Note = require('../../../../src/lib/connectors/bookshelf/Note')
const repo = require('../../../../src/lib/connectors/repos/notes')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')
const { v4: uuid } = require('uuid')

experiment('lib/connectors/repos/notes', () => {
  let model, stub

  beforeEach(async () => {
    sandbox.stub(helpers, 'create')
    sandbox.stub(helpers, 'findOne')

    model = {
      toJSON: sandbox.stub().returns({ noteId: 'test-note-id-1' })
    }

    stub = {
      fetch: sandbox.stub().resolves(model)
    }

    sandbox.stub(Note, 'forge').returns({
      where: sandbox.stub().returns({
        where: sandbox.stub().returns(stub)
      })
    })
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.create', () => {
    const data = { id: 'test-note-id-1' }

    test('delegates to helpers.update', async () => {
      await repo.create(data)
      expect(helpers.create.calledWith(
        Note,
        data
      ))
    })
  })

  experiment('.findOne', () => {
    test('delegates to helpers.findOne', async () => {
      const tempGuid = uuid()
      await repo.findOne(tempGuid)
      expect(helpers.findOne.calledWith(
        tempGuid
      ))
    })
  })

  experiment('.findByChargeVersionId', () => {
    let result

    beforeEach(async () => {
      result = await repo.findByChargeVersionId('test-id')
    })

    test('calls fetch()', async () => {
      expect(stub.fetch.called).to.be.true()
    })

    test('calls toJSON() on returned model', async () => {
      expect(model.toJSON.callCount).to.equal(1)
    })

    test('returns the result of the toJSON() call', async () => {
      expect(result).to.equal({ noteId: 'test-note-id-1' })
    })
  })
})
