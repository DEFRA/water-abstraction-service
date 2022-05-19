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

const returnVersionsRepo = require('../../../../src/lib/connectors/repos/return-versions')
const ReturnVersion = require('../../../../src/lib/connectors/bookshelf/ReturnVersion')

experiment('lib/connectors/repos/return-versions', () => {
  let stub
  let collection

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findByLicenceId', () => {
    beforeEach(async () => {
      collection = {
        toJSON: sandbox.stub()
      }
      stub = {
        fetch: sandbox.stub().resolves(collection),
        where: sandbox.stub().returnsThis()
      }

      sandbox.stub(ReturnVersion, 'collection').returns(stub)

      await returnVersionsRepo.findByLicenceId('test-licence-id')
    })

    test('calls the methods in the right order', async () => {
      sinon.assert.callOrder(
        ReturnVersion.collection,
        stub.where,
        stub.fetch,
        collection.toJSON
      )
    })

    test('queries by licence id', async () => {
      const [field, id] = stub.where.lastCall.args
      expect(field).to.equal('licence_id')
      expect(id).to.equal('test-licence-id')
    })

    test('calls .fetch() to retrieve all matching records', async () => {
      expect(stub.fetch.called).to.be.true()
    })

    test('calls toJSON on the collection', async () => {
      expect(collection.toJSON.called).to.be.true()
    })
  })
})
