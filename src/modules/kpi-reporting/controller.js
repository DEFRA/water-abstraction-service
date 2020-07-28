'use-strict';
const helpers = require('@envage/water-abstraction-helpers');
const dataService = require('./services/data-service');

const mappers = require('./lib/mappers');

const getReturnCycles = async () => {
// get the last 2 returns cycles parameters
  return helpers.returns.date.createReturnCycles().slice(-2);
};

/**
 * This method requests all the KPI data sets maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKPIData = async (request) => {
  const returnCycles = await getReturnCycles();
  const [registrationsData, delegatedAccessData, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData] = await Promise.all([
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
  ]);

  // Map and return the data
  const emptyResponse = { totals: { allTime: 0, ytd: 0 }, monthly: [] };
  const returnsMonthly = returnsDataMonthly ? mappers.mapReturnsDataMonthly(returnsDataMonthly) : emptyResponse;
  const returnsCycle1 = returnsDataCycle1 ? mappers.mapReturnsDataByCycle(returnsDataCycle1, returnCycles[1]) : {};
  const returnsCycle2 = returnsDataCycle2 ? mappers.mapReturnsDataByCycle(returnsDataCycle2, returnCycles[0]) : {};
  const licenceNames = licenceNamesData ? mappers.mapLicenceNamesData(licenceNamesData) : emptyResponse;
  const registrations = registrationsData || emptyResponse;
  const delegatedAccess = delegatedAccessData || emptyResponse;
  return { data: { registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames } };
};

module.exports.getKPIData = getKPIData;
