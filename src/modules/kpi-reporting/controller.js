'use-strict';
const helpers = require('@envage/water-abstraction-helpers');
const dataService = require('./services/data-service');

const Boom = require('@hapi/boom');
const mappers = require('./lib/mappers');

// generates a combined error message for any null data sets
const confirmDataReturned =
(registrations, delegatedAccess, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData) => {
  return (registrations === null ? 'IDM for registrations, ' : '') +
  (delegatedAccess === null ? 'CRM for delegated access, ' : '') +
  (returnsDataMonthly === null ? 'Events data for returns monthly, ' : '') +
  (returnsDataCycle1 === null ? 'Returns data for cycle 1, ' : '') +
  (returnsDataCycle2 === null ? 'Returns data for cycle 2, ' : '') +
  (licenceNamesData === null ? 'Events data for naming licences' : '');
};

/**
 * This method requests all the KPI data sets maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKPIData = async (request) => {
  // Registrations data from IDM
  const registrations = await dataService.getIDMRegistrationsData();

  // Delegated access - CRM 1.0
  const delegatedAccess = await dataService.getCRMDelegatedAccessData();

  // Returns Monthly data - events table
  const returnsDataMonthly = await dataService.getReturnsDataByMonth();

  // Returns by cycle for last 2 cycles
  const returnCycle = helpers.returns.date.createReturnCycles().slice(-2);
  const returnsDataCycle1 = await dataService.getReturnsDataByCycle(returnCycle[1].startDate, returnCycle[1].endDate, returnCycle[1].isSummer);
  const returnsDataCycle2 = await dataService.getReturnsDataByCycle(returnCycle[0].startDate, returnCycle[0].endDate, returnCycle[0].isSummer);

  // Naming documents - events table
  const licenceNamesData = await dataService.getLicenceNamesData();

  // check all the data has returned
  const message = confirmDataReturned(registrations, delegatedAccess, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData);
  if (message.length > 0) {
    return Boom.notFound(`Missing data: ${message}`);
  };

  // Map and return the data
  const returnsMonthly = mappers.mapReturnsDataMonthly(returnsDataMonthly);
  const returnsCycle1 = mappers.mapReturnsDataByCycle(returnsDataCycle1, returnCycle[1]);
  const returnsCycle2 = mappers.mapReturnsDataByCycle(returnsDataCycle2, returnCycle[0]);
  const licenceNames = mappers.mapLicenceNamesData(licenceNamesData);
  return { data: { registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames } };
};

module.exports.getKPIData = getKPIData;
