const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { v4: uuid } = require('uuid')
const regionsService = require('../../../src/lib/services/regions-service')
const regionsRepo = require('../../../src/lib/connectors/repos/regions')
const mappers = require('../../../src/lib/mappers')
const Region = require('../../../src/lib/models/region')
const { NotFoundError } = require('../../../src/lib/errors')

experiment('modules/billing/services/regions-service', () => {
  let regionId, region, regionModel, response
  beforeEach(async () => {
    regionId = uuid()
    region = {
      regionId,
      chargeRegionId: 'N'
    }
    regionModel = new Region(regionId)
    regionModel.code = region.chargeRegionId
    sandbox.stub(regionsRepo, 'findOne').resolves(region)
    sandbox.stub(mappers.region, 'dbToModel').resolves(regionModel)

    response = await regionsService.getRegion(regionId)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getRegion', () => {
    test('passes the region id to the repo', async () => {
      expect(regionsRepo.findOne.calledWith(
        regionId
      )).to.be.true()
    })

    test('maps the region to the model', async () => {
      expect(mappers.region.dbToModel.calledWith(
        region
      )).to.be.true()
    })

    test('returns a Region model', async () => {
      expect(response).to.be.instanceOf(Region)
      expect(response.id).to.equal(regionId)
    })

    test('if no region is found, throws a NotFoundError', async () => {
      regionsRepo.findOne.resolves(null)
      try {
        response = await regionsService.getRegion(regionId)
      } catch (err) {
        expect(err).to.be.instanceOf(NotFoundError)
        expect(err.message).to.equal(`Region ${regionId} not found`)
      }
    })
  })
})
