const { expect } = require('@hapi/code')
const {
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const routes = require('../../../src/modules/gauging-stations/routes')
const controllers = require('../../../src/modules/gauging-stations/controller')

experiment('.getGaugingStation', () => {
  test('it has the right method', () => {
    expect(routes.getGaugingStation.method).to.equal('GET')
  })
  test('it calls the right controller', () => {
    expect(routes.getGaugingStation.handler).to.equal(controllers.getGaugingStation)
  })
  test('it has the right path', () => {
    expect(routes.getGaugingStation.path).to.equal('/water/1.0/gauging-stations/{stationGuid}')
  })
})

experiment('.createLicenceGaugingStationLink', () => {
  const payload = {
    licenceId: '00000000-0000-0000-0000-000000000001',
    licenceVersionPurposeConditionId: '00000000-0000-0000-0000-000000000002',
    thresholdUnit: 'SLD',
    thresholdValue: 10,
    restrictionType: 'flow',
    alertType: 'reduce'
  }

  test('it has a valid thresholdUnit in the payload', () => {
    const schema = routes.createLicenceGaugingStationLink.config.validate.payload
    const result = schema.validate(payload)
    expect(result.value).to.equal(payload)
  })

  test('it has an invalid thresholdUnit in the payload', () => {
    const schema = routes.createLicenceGaugingStationLink.config.validate.payload
    const result = schema.validate({ ...payload, thresholdUnit: 'xxx' })
    expect(result.error.message).to.equal('"thresholdUnit" must be one of [Ml/d, m3/s, m3/d, l/s, mAOD, mBOD, mASD, m, SLD]')
  })
})
