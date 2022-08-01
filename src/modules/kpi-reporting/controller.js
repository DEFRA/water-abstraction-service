'use-strict'

const dataService = require('./services/data-service')

const mappers = require('./lib/mappers')

const collectKpiData = async () => {
  const [registrations, delegatedAccess, returnsMonthly, returnCycles, licenceNames] = await Promise.allSettled([
    // Registrations data from IDM
    dataService.getIDMRegistrationsData(),
    // Delegated access - CRM 1.0
    dataService.getCRMDelegatedAccessData(),
    // Returns Monthly data - events table
    dataService.getReturnsDataByMonth(),
    // Returns by cycle for last 2 cycles
    dataService.getReturnCycles(),
    dataService.getLicenceNamesData()
  ]).then(responses => {
    return responses.map(response => response.status === 'fulfilled' ? response.value : null)
  })

  return { returnCycles, registrations, delegatedAccess, returnsMonthly, licenceNames }
}

/**
 * This method requests all the KPI data sets, maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKpiData = async (request) => {
  const kpiData = await collectKpiData()

  return {
    data: {
      registrations: dataOrEmpty(kpiData.registrations),
      delegatedAccess: dataOrEmpty(kpiData.delegatedAccess),
      returnsMonthly: dataOrEmpty(kpiData.returnsMonthly, mappers.mapReturnsDataMonthly),
      returnCycles: kpiData.returnCycles || [],
      licenceNames: dataOrEmpty(kpiData.licenceNames, mappers.mapLicenceNamesData)
    }
  }
}

const getEmptyResponse = () => ({ totals: { allTime: 0, ytd: 0 }, monthly: [] })

const dataOrEmpty = (data, mapper, empty = getEmptyResponse()) => {
  return data
    ? mapper ? mapper(data) : data
    : empty
}

module.exports.getKpiData = getKpiData
