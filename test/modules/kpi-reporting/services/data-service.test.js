'use strict'

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')
const sandbox = require('sinon').createSandbox()

const dataService = require('../../../../src/modules/kpi-reporting/services/data-service')
const events = require('../../../../src/lib/connectors/repos/events')
const crm = require('../../../../src/lib/connectors/crm/kpi-reporting')
const idm = require('../../../../src/lib/connectors/idm/kpi-reporting')
const returns = require('../../../../src/lib/connectors/returns')

experiment('./modules/kpi-reporting/services/data-service', () => {
  const crmData = {
    data: {
      totals: { allTime: 17, ytd: 14 },
      monthly: [{ month: 'June', year: 2020, total: 10, change: 100 }]
    }
  }
  const idmData = {
    data: {
      totals: { allTime: 20, ytd: 18 },
      monthly: [{ month: 'June', internal: 2, external: 1, year: 2020 }]
    }
  }
  const returnsDataCycle = {
    data: [
      { due: 1000, internalOnTime: 1, internalLate: 1, externalOnTime: 1, externalLate: 1 },
      { due: 2000, internalOnTime: 2, internalLate: 2, externalOnTime: 2, externalLate: 2 },
      { due: 3000, internalOnTime: 3, internalLate: 3, externalOnTime: 3, externalLate: 3 }
    ]
  }
  const returnsDataMonthly = { rowCount: 1, rows: [{ current_year: true, month: 1, request: 0, return: 1 }] }
  const licenceNamesData = {
    rowCount: 1,
    rows: [{ current_year: true, month: 1, named: 220, renamed: 110, year: 2020 }]
  }

  const returnCycles = [
    { startDate: '2017-11-01', endDate: '2018-10-31', isSummer: true },
    { startDate: '2018-04-01', endDate: '2019-03-31', isSummer: false }
  ]

  beforeEach(async => {
    sandbox.stub(events, 'getKPILicenceNamesData')
    sandbox.stub(events, 'getKPIReturnsMonthlyData')
    sandbox.stub(idm, 'getKPIRegistrations')
    sandbox.stub(crm, 'getKPIAccessRequests')
    sandbox.stub(returns, 'getReturnsCyclesReport')
  })

  afterEach(async => {
    sandbox.restore()
  })

  experiment('When data from services returns 404 or null', () => {
    beforeEach(async => {
      events.getKPILicenceNamesData.returns({ rowCount: 0, rows: [], error: 'no data' })
      events.getKPIReturnsMonthlyData.returns({ rowCount: 0, rows: [], error: 'no data' })
      idm.getKPIRegistrations.rejects({ statusCode: 404 })
      crm.getKPIAccessRequests.rejects({ statusCode: 404 })
      returns.getReturnsCyclesReport.rejects({ statusCode: 404 })
    })
    test('Licence Names data is null', async () => {
      const response = await dataService.getLicenceNamesData()
      expect(response).to.be.equal(null)
    })
    test('Returns Monthly data is null', async () => {
      const response = await dataService.getReturnsDataByMonth()
      expect(response).to.be.equal(null)
    })
    test('Registrations data is null', async () => {
      const response = await dataService.getIDMRegistrationsData()
      expect(response).to.be.equal(null)
    })
    test('Delegated access data is null', async () => {
      const response = await dataService.getCRMDelegatedAccessData()
      expect(response).to.be.equal(null)
    })
    test('Returns cycle data is null', async () => {
      const response = await dataService.getReturnCycles(returnCycles[0])
      expect(response).to.be.equal(null)
    })
  })

  experiment('when data from services are returned', () => {
    beforeEach(async => {
      events.getKPILicenceNamesData.returns(licenceNamesData)
      events.getKPIReturnsMonthlyData.returns(returnsDataMonthly)
      idm.getKPIRegistrations.returns(idmData)
      crm.getKPIAccessRequests.returns(crmData)
      returns.getReturnsCyclesReport.returns(returnsDataCycle)
    })

    test('Licence Named data from events is returned in the right shape', async () => {
      const licenceNames = await dataService.getLicenceNamesData()
      expect(licenceNames[0].currentYear).to.be.true()
      expect(licenceNames[0].named).to.equal(220)
      expect(licenceNames[0].renamed).to.equal(110)
      expect(licenceNames[0].year).to.equal(2020)
    })

    test('registrations data from events is returned in the right shape', async () => {
      const registrations = await dataService.getIDMRegistrationsData()
      expect(registrations.totals).to.be.equal({ allTime: 20, ytd: 18 })
      expect(registrations.monthly[0].month).to.equal('June')
      expect(registrations.monthly[0].internal).to.equal(2)
      expect(registrations.monthly[0].external).to.equal(1)
      expect(registrations.monthly[0].year).to.equal(2020)
    })

    test('Returns monthly data from events is returned in the right shape', async () => {
      const returnsMonthly = await dataService.getReturnsDataByMonth()
      expect(returnsMonthly[0].month).to.equal(1)
      expect(returnsMonthly[0].request).to.equal(0)
      expect(returnsMonthly[0].return).to.equal(1)
      expect(returnsMonthly[0].currentYear).to.be.true()
    })

    test('Delegated access data from CRM is returned in the right shape', async () => {
      const delegatedAccess = await dataService.getCRMDelegatedAccessData()
      expect(delegatedAccess.totals).to.be.equal({ allTime: 17, ytd: 14 })
      expect(delegatedAccess.monthly[0].month).to.equal('June')
      expect(delegatedAccess.monthly[0].total).to.equal(10)
      expect(delegatedAccess.monthly[0].change).to.equal(100)
      expect(delegatedAccess.monthly[0].year).to.equal(2020)
    })

    experiment('getReturnsDataByCycle', () => {
      let result

      beforeEach(async () => {
        result = await dataService.getReturnCycles('2020-03-30')
      })

      test('requests the most recent 2 cycles that have not yet opened for data', async () => {
        expect(returns.getReturnsCyclesReport.calledWith(
          '2018-04-01'
        )).to.be.true()
      })

      test('returns the first 2 cycles retrieved', async () => {
        expect(result).to.be.an.array().length(2)
        expect(result).to.only.include([
          returnsDataCycle.data[0],
          returnsDataCycle.data[1]
        ])
      })
    })
  })
})
