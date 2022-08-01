const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const returnRequirementPurposes = require('../../../../src/lib/connectors/repos/return-requirement-purposes')
const { ReturnRequirementPurpose } = require('../../../../src/lib/connectors/bookshelf')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/purpose-primary', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'findOne').resolves({})
    sandbox.stub(helpers, 'create').resolves({})
  })

  afterEach(async () => sandbox.restore())

  experiment('.findOneByExternalId', () => {
    beforeEach(async () => {
      await returnRequirementPurposes.findOneByExternalId('external-id')
    })

    test('calls helpers .findOne() with the correct params', async () => {
      const [model, idKey, id] = helpers.findOne.lastCall.args
      expect(model).to.equal(ReturnRequirementPurpose)
      expect(idKey).to.equal('externalId')
      expect(id).to.equal('external-id')
    })
  })
  experiment('.create', () => {
    const data = { externalId: 'external-id' }
    beforeEach(async () => {
      await returnRequirementPurposes.create(data)
    })

    test('calls helpers .create() with the correct params', async () => {
      const [bookShelfModel, createdData] = helpers.create.lastCall.args
      expect(bookShelfModel).to.equal(ReturnRequirementPurpose)
      expect(createdData).to.equal(data)
    })
  })
})
