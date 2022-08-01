'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()

const sandbox = require('sinon').createSandbox()
const controller = require('../../../src/modules/kpi-reporting/controller')
const dataService = require('../../../src/modules/kpi-reporting/services/data-service')
const { expect } = require('@hapi/code')
const helpers = require('@envage/water-abstraction-helpers')

experiment('./modules/kpi-reporting/controller', () => {
  const crmData = {
    totals: { allTime: 17, ytd: 14 },
    monthly: [{ month: 'June', year: 2020, total: 10, change: 100 }]
  }
  const idmData = {
    totals: { allTime: 20, ytd: 18 },
    monthly: [{ month: 'June', internal: 2, external: 1, year: 2020 }]
  }
  const returnsDataMonthly = [
    { currentYear: true, month: 1, paperFormCount: 2, returnCount: 5, year: 2020, sentNotificationCount: 7 },
    { currentYear: false, month: 1, paperFormCount: 1, returnCount: 1, year: 2019, sentNotificationCount: 1 }
  ]
  const licenceNamesData = [
    { currentYear: true, month: 1, named: 220, renamed: 110, year: 2020 },
    { currentYear: false, month: 12, named: 200, renamed: 100, year: 2019 }
  ]

  const returnCycles = [
    { startDate: '2017-11-01', endDate: '2018-10-31', isSummer: true },
    { startDate: '2018-04-01', endDate: '2019-03-31', isSummer: false }
  ]

  beforeEach(async => {
    sandbox.stub(dataService, 'getLicenceNamesData')
    sandbox.stub(dataService, 'getReturnsDataByMonth')
    sandbox.stub(dataService, 'getIDMRegistrationsData')
    sandbox.stub(dataService, 'getCRMDelegatedAccessData')
    sandbox.stub(dataService, 'getReturnCycles')
    sandbox.stub(helpers.returns.date, 'createReturnCycles').returns(returnCycles)
  })

  afterEach(async => {
    sandbox.restore()
  })

  experiment('when data from services are missing', () => {
    beforeEach(async => {
      dataService.getLicenceNamesData.resolves(null)
      dataService.getReturnsDataByMonth.resolves(null)
      dataService.getIDMRegistrationsData.resolves(null)
      dataService.getCRMDelegatedAccessData.resolves(null)
      dataService.getReturnCycles.resolves(null)
    })
    test('Empty data responses are returned', async () => {
      const emptyResponse = { totals: { allTime: 0, ytd: 0 }, monthly: [] }
      const emptyDataResponse = {
        data: {
          registrations: emptyResponse,
          delegatedAccess: emptyResponse,
          returnsMonthly: emptyResponse,
          returnCycles: [],
          licenceNames: emptyResponse
        }
      }
      const response = await controller.getKpiData({})
      expect(response).to.be.equal(emptyDataResponse)
    })
  })

  experiment('when data from services are returned', () => {
    beforeEach(async => {
      dataService.getLicenceNamesData.resolves(licenceNamesData)
      dataService.getReturnsDataByMonth.resolves(returnsDataMonthly)
      dataService.getIDMRegistrationsData.resolves(idmData)
      dataService.getCRMDelegatedAccessData.resolves(crmData)
      dataService.getReturnCycles.resolves(returnCycles)
    })

    test('Licence Named data from events is returned in the right shape', async () => {
      const { data: { licenceNames } } = await controller.getKpiData()
      expect(licenceNames.totals).to.be.equal({ allTime: 630, ytd: 330 })
      expect(licenceNames.monthly[0].currentYear).to.be.true()
      expect(licenceNames.monthly[0].named).to.equal(220)
      expect(licenceNames.monthly[0].renamed).to.equal(110)
      expect(licenceNames.monthly[0].year).to.equal(2020)
      expect(licenceNames.monthly[0].namedChange).to.equal(10)
      expect(licenceNames.monthly[0].renamedChange).to.equal(10)
    })

    test('registrations data from events is returned in the right shape', async () => {
      const { data: { registrations } } = await controller.getKpiData()
      expect(registrations.totals).to.be.equal({ allTime: 20, ytd: 18 })
      expect(registrations.monthly[0].month).to.equal('June')
      expect(registrations.monthly[0].internal).to.equal(2)
      expect(registrations.monthly[0].external).to.equal(1)
      expect(registrations.monthly[0].year).to.equal(2020)
    })

    test('Returns monthly data from events is returned in the right shape', async () => {
      const { data: { returnsMonthly } } = await controller.getKpiData()
      expect(returnsMonthly.totals).to.be.equal({ allTime: 6, ytd: 5 })
      expect(returnsMonthly.monthly[0].month).to.equal('January')
      expect(returnsMonthly.monthly[0].paperFormCount).to.equal(2)
      expect(returnsMonthly.monthly[0].returnCount).to.equal(5)
      expect(returnsMonthly.monthly[0].sentNotificationCount).to.equal(7)
      expect(returnsMonthly.monthly[0].currentYear).to.equal(2020)
    })
    test('Delegated access data from CRM is returned in the right shape', async () => {
      const { data: { delegatedAccess } } = await controller.getKpiData()
      expect(delegatedAccess.totals).to.be.equal({ allTime: 17, ytd: 14 })
      expect(delegatedAccess.monthly[0].month).to.equal('June')
      expect(delegatedAccess.monthly[0].total).to.equal(10)
      expect(delegatedAccess.monthly[0].change).to.equal(100)
      expect(delegatedAccess.monthly[0].year).to.equal(2020)
    })

    test('Last 2 return cycles data are returned in the expected shape', async () => {
      const { data } = await controller.getKpiData()
      expect(data.returnCycles).to.equal(returnCycles)
    })
  })
})
