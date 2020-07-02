'use-strict';
const helpers = require('@envage/water-abstraction-helpers');
const dataService = require('./services/data-service');

const Boom = require('@hapi/boom');
const mappers = require('./lib/mappers');

const isDataNull = (data, errorMessage) => {
  return data === null ? errorMessage : '';
};

/**
 * This method requests all the KPI data sets maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKPIData = async (request) => {
  let errorMessage;
  // Registrations data from IDM
  const registrations = await dataService.getIDMRegistrationsData();
  errorMessage = isDataNull(registrations, 'IDM for registrations, ');
  // Delegated access - CRM 1.0
  const delegatedAccess = await dataService.getCRMDelegatedAccessData();
  errorMessage += isDataNull(delegatedAccess, 'CRM for delegated access, ');
  // Returns Monthly data - events table
  const returnsDataMonthly = await dataService.getReturnsDataByMonth();
  errorMessage += isDataNull(returnsDataMonthly, 'Events data for returns monthly, ');
  // Returns by cycle for last 2 cycles
  const returnCycle = helpers.returns.date.createReturnCycles().slice(-2);
  const returnsDataCycle1 = await dataService.getReturnsDataByCycle(returnCycle[1].startDate, returnCycle[1].endDate, returnCycle[1].isSummer);
  errorMessage += isDataNull(returnsDataCycle1, 'Returns data for cycle 1, ');
  const returnsDataCycle2 = await dataService.getReturnsDataByCycle(returnCycle[0].startDate, returnCycle[0].endDate, returnCycle[0].isSummer);
  errorMessage += isDataNull(returnsDataCycle1, 'Returns data for cycle 2, ');
  // Naming documents - events table
  const licenceNamesData = await dataService.getLicenceNamesData();
  errorMessage += isDataNull(returnsDataCycle2, 'Events data for naming licences');
  // check all the data has returned
  if (errorMessage.length > 0) {
    return Boom.notFound(`Missing data: ${errorMessage}`);
  };

  // Map and return the data
  const returnsMonthly = mappers.mapReturnsDataMonthly(returnsDataMonthly);
  const returnsCycle1 = mappers.mapReturnsDataByCycle(returnsDataCycle1, returnCycle[1]);
  const returnsCycle2 = mappers.mapReturnsDataByCycle(returnsDataCycle2, returnCycle[0]);
  const licenceNames = mappers.mapLicenceNamesData(licenceNamesData);
  return { data: { registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames } };
};

module.exports.getKPIData = getKPIData;
