const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()
const { v4: uuid } = require('uuid')

const licenceGaugingStations = require('../../../../src/lib/connectors/repos/licence-gauging-stations')
const { LicenceGaugingStations } = require('../../../../src/lib/connectors/bookshelf')
const helpers = require('../../../../src/lib/connectors/repos/lib/helpers')

experiment('lib/connectors/repos/licence-gauging-stations', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'create').resolves({})
    sandbox.stub(helpers, 'findOne').resolves({})
    sandbox.stub(helpers, 'update').resolves({})
  })

  afterEach(async () => sandbox.restore())

  experiment('.findOneById', () => {
    const tempGuid = uuid()
    beforeEach(async () => {
      await licenceGaugingStations.findOneById(tempGuid)
    })

    test('calls helpers .findOne() with the correct params', async () => {
      const [bookShelfModel, identifierName, identifierValue] = helpers.findOne.lastCall.args
      expect(bookShelfModel).to.equal(LicenceGaugingStations)
      expect(identifierName).to.equal('licenceGaugingStationId')
      expect(identifierValue).to.equal(tempGuid)
    })
  })

  experiment('.create', () => {
    const data = {
      gaugingStationId: uuid(),
      licenceId: uuid(),
      licenceVersionPurposeConditionId: null,
      thresholdUnit: 'm',
      thresholdValue: 0,
      abstractionPeriod: null,
      restrictionType: 'level',
      alertType: 'reduce',
      source: 'wrls'
    }
    beforeEach(async () => {
      await licenceGaugingStations.create(data)
    })

    test('calls helpers .create() with the correct params', async () => {
      const [bookShelfModel, createdData] = helpers.create.lastCall.args
      expect(bookShelfModel).to.equal(LicenceGaugingStations)
      expect(createdData).to.equal(data)
    })
  })

  experiment('.deleteOne', () => {
    const tempGuid = uuid()
    beforeEach(async () => {
      await licenceGaugingStations.deleteOne(tempGuid)
    })

    test('calls helpers .update() with the correct params', async () => {
      const [bookShelfModel, identifierName, identifierValue, changes] = helpers.update.lastCall.args
      expect(bookShelfModel).to.equal(LicenceGaugingStations)
      expect(identifierName).to.equal('licenceGaugingStationId')
      expect(identifierValue).to.equal(tempGuid)
      expect(changes).to.be.object()
      expect(changes.date_deleted).to.be.date()
    })
  })

  experiment('.updateStatus', () => {
    const tempGuid = uuid()
    beforeEach(async () => {
      await licenceGaugingStations.updateStatus(tempGuid, 'some-status')
    })

    test('calls helpers .update() with the correct params', async () => {
      const [bookShelfModel, identifierName, identifierValue, changes] = helpers.update.lastCall.args
      expect(bookShelfModel).to.equal(LicenceGaugingStations)
      expect(identifierName).to.equal('licenceGaugingStationId')
      expect(identifierValue).to.equal(tempGuid)
      expect(changes).to.be.object()
      expect(changes.status).to.equal('some-status')
      expect(changes.dateStatusUpdated).to.be.date()
    })
  })
})
