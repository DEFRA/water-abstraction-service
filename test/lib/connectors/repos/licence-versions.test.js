'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const sandbox = require('sinon').createSandbox()
const moment = require('moment')
const { licenceVersions } = require('../../../../src/lib/connectors/repos')
const LicenceVersion = require('../../../../src/lib/connectors/bookshelf/LicenceVersion')
const raw = require('../../../../src/lib/connectors/repos/lib/raw')
const queries = require('../../../../src/lib/connectors/repos/queries/licence-versions')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/licence-versions', () => {
  let stub
  let result

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.findByLicenceId', () => {
    beforeEach(async () => {
      stub = {
        fetchAll: sandbox.stub().resolves({
          toJSON: () => ([
            { licenceVersionId: 'ver-1' },
            { licenceVersionId: 'ver-2' }
          ])
        }),
        where: sandbox.stub().returnsThis()
      }
      sandbox.stub(LicenceVersion, 'forge').returns(stub)

      result = await licenceVersions.findByLicenceId('test-licence-id')
    })

    test('queries by licence id', async () => {
      const [field, id] = stub.where.lastCall.args
      expect(field).to.equal('licence_id')
      expect(id).to.equal('test-licence-id')
    })

    test('calls .fetchAll() to retrieve all matching records', async () => {
      expect(stub.fetchAll.called).to.be.true()
    })

    test('resolves with the results', async () => {
      expect(result).to.equal([
        { licenceVersionId: 'ver-1' },
        { licenceVersionId: 'ver-2' }
      ])
    })
  })

  experiment('.findOne', () => {
    beforeEach(async () => {
      stub = {
        fetch: sandbox.stub().resolves({
          toJSON: () => ({
            licenceVersionId: 'ver-1'
          })
        })
      }

      sandbox.stub(LicenceVersion, 'forge').returns(stub)

      result = await licenceVersions.findOne('test-licence-version-id')
    })

    test('queries by licence version id', async () => {
      const [query] = LicenceVersion.forge.lastCall.args
      expect(query.licenceVersionId).to.equal('test-licence-version-id')
    })

    test('does not require the id matches a record', async () => {
      const [options] = stub.fetch.lastCall.args
      expect(options.require).to.equal(false)
    })

    test('adds the purpose use relation', async () => {
      const [options] = stub.fetch.lastCall.args
      expect(options.withRelated).to.include('licenceVersionPurposes.purposeUse')
    })

    test('resolves with the result', async () => {
      expect(result).to.equal({
        licenceVersionId: 'ver-1'
      })
    })

    test('resolves with null if there is no result', async () => {
      stub = {
        fetch: sandbox.stub().resolves(null)
      }

      LicenceVersion.forge.returns(stub)

      result = await licenceVersions.findOne('test-licence-version-id')

      expect(result).to.equal(null)
    })
  })

  experiment('.findIdsByDateNotInChargeVersionWorkflows', () => {
    const dateAndTime = moment().toISOString()

    beforeEach(async () => {
      sandbox.stub(raw, 'multiRow')
      await licenceVersions.findIdsByDateNotInChargeVersionWorkflows(dateAndTime)
    })

    test('calls knex.raw() with correct arguments', async () => {
      const [query, params] = raw.multiRow.lastCall.args
      expect(query).to.equal(queries.getNewLicenceVersionsForChargeVersionWorkflow)
      expect(params).to.equal({ dateAndTime })
    })
  })

  experiment('.create', () => {
    beforeEach(async () => {
      sandbox.stub(helpers, 'create').resolves()

      await licenceVersions.create({ foo: 'bar' })
    })

    test('creating a new record is delegated to helpers function', () => {
      expect(helpers.create.calledWith(LicenceVersion, { foo: 'bar' })).to.be.true()
    })
  })
})
