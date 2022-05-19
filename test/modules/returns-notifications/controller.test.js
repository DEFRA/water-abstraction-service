const { expect } = require('@hapi/code')
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script()

const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const { returns } = require('../../../src/lib/connectors/returns')
const permitsConnector = require('../../../src/lib/connectors/permit')
const controller = require('../../../src/modules/returns-notifications/controller')

experiment('postPreviewReturnNotification', () => {
  let response
  beforeEach(async () => {
    sandbox.stub(returns, 'findAll').resolves([
      { licence_ref: 'lic1', return_id: 'ret1' },
      { licence_ref: 'lic2', return_id: 'ret2' },
      { licence_ref: 'lic3', return_id: 'ret3' },
      { licence_ref: 'lic4', return_id: 'ret4' }
    ])

    sandbox.stub(permitsConnector, 'getLicenceEndDates').resolves({
      lic1: { dateRevoked: null, dateExpired: null, dateLapsed: null },
      lic2: { dateRevoked: '2002-02-02', dateExpired: null, dateLapsed: null },
      lic3: { dateRevoked: null, dateExpired: '2003-03-03', dateLapsed: null },
      lic4: { dateRevoked: null, dateExpired: null, dateLapsed: '2004-04-04' }
    })

    const request = {
      params: {},
      payload: {}
    }

    response = await controller.postPreviewReturnNotification(request)
  })

  afterEach(async () => {
    sandbox.restore()
  })

  test('returns the licence_ref and return_id', async () => {
    expect(response.data.find(x => x.licence_ref === 'lic1').return_id).to.equal('ret1')
    expect(response.data.find(x => x.licence_ref === 'lic2').return_id).to.equal('ret2')
    expect(response.data.find(x => x.licence_ref === 'lic3').return_id).to.equal('ret3')
    expect(response.data.find(x => x.licence_ref === 'lic4').return_id).to.equal('ret4')
  })

  test('adds the end dates', async () => {
    expect(response.data.find(x => x.licence_ref === 'lic1')).to.equal({
      licence_ref: 'lic1',
      return_id: 'ret1',
      dateRevoked: null,
      dateExpired: null,
      dateLapsed: null
    })

    expect(response.data.find(x => x.licence_ref === 'lic2')).to.equal({
      licence_ref: 'lic2',
      return_id: 'ret2',
      dateRevoked: '2002-02-02',
      dateExpired: null,
      dateLapsed: null
    })

    expect(response.data.find(x => x.licence_ref === 'lic3')).to.equal({
      licence_ref: 'lic3',
      return_id: 'ret3',
      dateRevoked: null,
      dateExpired: '2003-03-03',
      dateLapsed: null
    })

    expect(response.data.find(x => x.licence_ref === 'lic4')).to.equal({
      licence_ref: 'lic4',
      return_id: 'ret4',
      dateRevoked: null,
      dateExpired: null,
      dateLapsed: '2004-04-04'
    })
  })
})
