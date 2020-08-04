'use-strict';

const helpers = require('@envage/water-abstraction-helpers');
const dataService = require('./services/data-service');

const mappers = require('./lib/mappers');

const getReturnCycles = async () => {
// get the last 2 returns cycles parameters
  return helpers.returns.date.createReturnCycles().slice(-2);
};

const collectKpiData = async () => {
  const returnCycles = await getReturnCycles();
  const [registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames] = await Promise.allSettled([
    // Registrations data from IDM
    dataService.getIDMRegistrationsData(),
    // Delegated access - CRM 1.0
    dataService.getCRMDelegatedAccessData(),
    // Returns Monthly data - events table
    dataService.getReturnsDataByMonth(),
    // Returns by cycle for last 2 cycles
    dataService.getReturnsDataByCycle(returnCycles[1].startDate, returnCycles[1].endDate, returnCycles[1].isSummer),
    dataService.getReturnsDataByCycle(returnCycles[0].startDate, returnCycles[0].endDate, returnCycles[0].isSummer),
    dataService.getLicenceNamesData()
  ]).then(responses => {
    return responses.map(response => response.status === 'fulfilled' ? response.value : null);
  });

  return { returnCycles, registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames };
};

/**
 * This method requests all the KPI data sets, maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKpiData = async (request) => {
  const kpiData = await collectKpiData();

  return {
    data: {
      registrations: dataOrEmpty(kpiData.registrations),
      delegatedAccess: dataOrEmpty(kpiData.delegatedAccess),
      returnsMonthly: dataOrEmpty(kpiData.returnsMonthly, mappers.mapReturnsDataMonthly),
      returnsCycle1: getReturnsCycleData(kpiData.returnsCycle1, kpiData.returnCycles[1], {}),
      returnsCycle2: getReturnsCycleData(kpiData.returnsCycle2, kpiData.returnCycles[0], {}),
      licenceNames: dataOrEmpty(kpiData.licenceNames, mappers.mapLicenceNamesData)
    }
  };
};

const getReturnsCycleData = (data, returnCycle) => {
  return data
    ? mappers.mapReturnsDataByCycle(data, returnCycle)
    : {};
};

const getEmptyResponse = () => ({ totals: { allTime: 0, ytd: 0 }, monthly: [] });

const dataOrEmpty = (data, mapper, empty = getEmptyResponse()) => {
  return data
    ? mapper ? mapper(data) : data
    : empty;
};

module.exports.getKpiData = getKpiData;
