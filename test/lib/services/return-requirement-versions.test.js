'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const uuid = require('uuid/v4')
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const service = require('../../../src/lib/services/service')
const returnRequirementVersionService = require('../../../src/lib/services/return-requirement-versions')
const returnRequirementVersionMapper = require('../../../src/lib/mappers/return-requirement-version')
const returnVersionsRepo = require('../../../src/lib/connectors/repos/return-versions')

experiment('lib/services/return-requirement-versions', () => {
  beforeEach(async () => {
    sandbox.stub(service, 'findMany').resolves('test')
    sandbox.stub(returnVersionsRepo, 'findByLicenceId').resolves({})
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getByLicenceId', () => {
    test('delegates to the service.findOne function', async () => {
      const id = uuid()
      const result = await returnRequirementVersionService.getByLicenceId(id)

      expect(result).to.equal('test')

      const [licenceId, fetch, mapper] = service.findMany.lastCall.args
      expect(licenceId).to.equal(id)
      expect(fetch).to.equal(returnVersionsRepo.findByLicenceId)
      expect(mapper).to.equal(returnRequirementVersionMapper)
    })
  })
})
