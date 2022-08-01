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

const { ChangeReason } = require('../../../../src/lib/connectors/bookshelf')
const changeReasons = require('../../../../src/lib/connectors/repos/change-reasons')

experiment('lib/connectors/repos/change-reasons', () => {
  let collection, stub, result

  beforeEach(async () => {
    collection = {
      toJSON: sandbox.stub().returns([{ changeReasonId: 'test-id' }])
    }

    stub = {
      orderBy: sandbox.stub().returnsThis(),
      fetch: sandbox.stub().resolves(collection)
    }
    sandbox.stub(ChangeReason, 'collection').returns(stub)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.find', () => {
    beforeEach(async () => {
      result = await changeReasons.find()
    })

    test('.collection() is called', async () => {
      expect(ChangeReason.collection.called).to.be.true()
    })

    test('collection is sorted on description property', async () => {
      expect(stub.orderBy.calledWith('description')).to.be.true()
    })

    test('.fetch() is called', async () => {
      expect(stub.fetch.called).to.be.true()
    })

    test('calls collection.toJSON()', async () => {
      expect(collection.toJSON.called).to.be.true()
    })

    test('returns result of collection.toJSON()', async () => {
      expect(result).to.be.an.array()
    })
  })
})
