const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const ChargeElement = require('../../../../src/lib/models/charge-element')
const { CHARGE_SEASON } = require('../../../../src/lib/models/constants')

const chargeElementsService = require('../../../../src/modules/billing/services/charge-elements-service')
const repos = require('../../../../src/lib/connectors/repository')

const data = {
  chargeElement: {
    chargeElementId: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high'
  },
  dbRow: {
    charge_element_id: '90d4af8a-1717-452c-84bd-467a7d55ade4',
    source: 'supported',
    season: CHARGE_SEASON.summer,
    loss: 'high'
  }
}

experiment('modules/billing/services/charge-elements-service', () => {
  let result

  beforeEach(async () => {
    sandbox.stub(repos.chargeElements, 'findOneById')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getById', () => {
    beforeEach(async () => {
      repos.chargeElements.findOneById.resolves(data.dbRow)
      result = await chargeElementsService.getById(data.dbRow)
    })

    test('returns an instance of ChargeElement', async () => {
      expect(result instanceof ChargeElement).to.be.true()
    })

    test('sets the .id property', async () => {
      expect(result.id).to.equal(data.chargeElement.chargeElementId)
    })

    test('sets the .source property', async () => {
      expect(result.source).to.equal(data.chargeElement.source)
    })

    test('sets the .season property', async () => {
      expect(result.season).to.equal(data.chargeElement.season)
    })

    test('sets the .loss property', async () => {
      expect(result.loss).to.equal(data.chargeElement.loss)
    })
  })
})
