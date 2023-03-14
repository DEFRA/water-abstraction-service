const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const { omit } = require('lodash')

const config = require('../../../../config')
const sinon = require('sinon')
const moment = require('moment')
const sandbox = sinon.createSandbox()

const syncGaugingStationsJob = require('../../../../src/modules/gauging-stations/jobs/sync-gauging-stations')

const s3Connector = require('../../../../src/lib/services/s3')
const applicationState = require('../../../../src/lib/services/application-state')
const gaugingStationsRepo = require('../../../../src/lib/connectors/repos/gauging-stations')
const gaugingStationsMapper = require('../../../../src/lib/mappers/gauging-station')

experiment('.createMessage', () => {
  let message

  beforeEach(async () => {
    message = syncGaugingStationsJob.createMessage()
  })

  test('creates a message with the expected name', async () => {
    expect(message[0]).to.equal('gauging-stations.sync-from-csv')
  })

  test('the message has no associated job data', async () => {
    expect(message[1]).to.equal({})
  })

  test('the message has a config object calling for repeats', async () => {
    expect(message[2]).to.equal({
      jobId: `gauging-stations.sync-from-csv.${moment().format('YYYYMMDD')}`,
      repeat: {
        every: config.import.gaugingStationsSyncFrequencyInMS
      }
    })
  })
})

experiment('.handler', () => {
  let newRecord = {}
  let gaugingStationCSVRowString
  const gaugingStationCSVRow = [
    '93337f15-b2cd-4dd9-a2b7-361689d93d6e',
    'some_station',
    'WiskiId',
    'Station 1',
    0,
    0,
    0,
    0,
    'GRIDREF',
    'catchment_name',
    'river_name'
  ]

  const gaugingStations = [{
    gaugingStationId: 'e041a36a-d62c-4446-9bb0-11e87bd1c3ba',
    label: 'station_1',
    hydrologyStationId: null,
    stationReference: null,
    gridReference: null,
    wiskiId: null
  }]

  const refreshNewRecord = () => {
    newRecord = gaugingStationsMapper.csvToModel({
      hydrology_station_id: gaugingStationCSVRow[0],
      station_reference: gaugingStationCSVRow[1],
      wiski_id: gaugingStationCSVRow[2],
      label: gaugingStationCSVRow[3],
      lat: gaugingStationCSVRow[4],
      long: gaugingStationCSVRow[5],
      easting: gaugingStationCSVRow[6],
      northing: gaugingStationCSVRow[7],
      grid_reference: gaugingStationCSVRow[8],
      catchment_name: gaugingStationCSVRow[9],
      river_name: gaugingStationCSVRow[10]
    })
    gaugingStationCSVRowString = `hydrology_station_id,station_reference,wiski_id,label,lat,long,easting,northing,grid_reference,catchment_name,river_name\n${gaugingStationCSVRow[0]},${gaugingStationCSVRow[1]},${gaugingStationCSVRow[2]},${gaugingStationCSVRow[3]},${gaugingStationCSVRow[4]},${gaugingStationCSVRow[5]},${gaugingStationCSVRow[6]},${gaugingStationCSVRow[7]},${gaugingStationCSVRow[8]},${gaugingStationCSVRow[9]},${gaugingStationCSVRow[10]}`

    s3Connector.getObject.resolves
      ? s3Connector.getObject.resolves({
        Body: gaugingStationCSVRowString,
        ETag: '123b'
      })
      : sandbox.stub(s3Connector, 'getObject').resolves({
        Body: gaugingStationCSVRowString,
        ETag: '123b'
      })
  }

  beforeEach(() => {
    refreshNewRecord()

    // Stub application state connector save and get
    sandbox.stub(applicationState, 'get').resolves({ data: { etag: null } })
    sandbox.stub(applicationState, 'save').resolves()

    // Stub gaugingStationsRepo.findAll, gaugingStationsRepo.update, gaugingStationsRepo.create
    sandbox.stub(gaugingStationsRepo, 'findAll').resolves(gaugingStations)
    sandbox.stub(gaugingStationsRepo, 'update').resolves()
    sandbox.stub(gaugingStationsRepo, 'create').resolves()
  })

  afterEach(() => sandbox.restore())

  experiment('When the ETag matches the known Etag in the application state', () => {
    beforeEach(() => {
      refreshNewRecord()
      applicationState.get.resolves({
        data: {
          etag: '123a'
        }
      })
      syncGaugingStationsJob.handler()
    })
    test('does nothing', () => {
      expect(gaugingStationsRepo.update.called).to.be.false()
    })
  })

  experiment('When the gauging station GUID matches', () => {
    beforeEach(async () => {
      gaugingStations[0].hydrologyStationId = '93337f15-b2cd-4dd9-a2b7-361689d93d6e'
      refreshNewRecord()
      await gaugingStationsRepo.findAll.resolves(gaugingStations)
      await syncGaugingStationsJob.handler()
    })
    afterEach(() => sandbox.restore())

    test('updates the existing station', () => {
      expect(gaugingStationsRepo.update.lastCall.args[0]).to.equal('e041a36a-d62c-4446-9bb0-11e87bd1c3ba')
      expect(omit(gaugingStationsRepo.update.lastCall.args[1], ['_gaugingStationId'])).to.equal(newRecord)
    })
  })

  experiment('When the gauging station reference matches', () => {
    beforeEach(async () => {
      gaugingStations[0].hydrologyStationId = null
      gaugingStations[0].stationReference = 'some_station'
      gaugingStationCSVRow[0] = ''
      refreshNewRecord()
      await gaugingStationsRepo.findAll.resolves(gaugingStations)
      await syncGaugingStationsJob.handler()
    })
    afterEach(async () => {
      sandbox.restore()
    })
    test('updates the existing station', () => {
      expect(gaugingStationsRepo.update.lastCall.args[0]).to.equal('e041a36a-d62c-4446-9bb0-11e87bd1c3ba')
      expect(omit(gaugingStationsRepo.update.lastCall.args[1], ['_gaugingStationId'])).to.equal(newRecord)
    })
  })

  experiment('When the gauging station Wiski ID matches', () => {
    beforeEach(async () => {
      gaugingStations[0].hydrologyStationId = null
      gaugingStations[0].stationReference = null
      gaugingStations[0].wiskiId = 'WiskiId'
      gaugingStationCSVRow[0] = ''
      gaugingStationCSVRow[1] = ''
      refreshNewRecord()
      gaugingStationsRepo.findAll.resolves(gaugingStations)
      await syncGaugingStationsJob.handler()
    })
    afterEach(() => sandbox.restore())
    test('updates the existing station', () => {
      expect(gaugingStationsRepo.update.lastCall.args[0]).to.equal('e041a36a-d62c-4446-9bb0-11e87bd1c3ba')
      expect(omit(gaugingStationsRepo.update.lastCall.args[1], ['_gaugingStationId'])).to.equal(newRecord)
    })
  })
  // When no properties match
  experiment('When none of the gauging station properties match', () => {
    beforeEach(async () => {
      gaugingStations[0].hydrologyStationId = null
      gaugingStations[0].stationReference = null
      gaugingStations[0].wiskiId = null
      gaugingStationCSVRow[0] = ''
      gaugingStationCSVRow[1] = ''
      gaugingStationCSVRow[2] = ''

      refreshNewRecord()
      gaugingStationsRepo.findAll.resolves(gaugingStations)
      await syncGaugingStationsJob.handler()
    })
    afterEach(() => sandbox.restore())
    test('Creates a new station', () => {
      expect(omit(gaugingStationsRepo.create.lastCall.args[0], ['_gaugingStationId'])).to.equal(newRecord)
    })
  })
})
