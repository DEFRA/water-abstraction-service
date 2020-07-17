'use-strict';
const helpers = require('@envage/water-abstraction-helpers');
const dataService = require('./services/data-service');

const Boom = require('@hapi/boom');
const mappers = require('./lib/mappers');

const getErrorMessage = (data, errorMessage) => {
  return data === null ? errorMessage : '';
};

/**
 * This method requests all the KPI data sets maps them and returns the data for the KPI UI
 * @param {*} request
 * @returns {Object} an object containing all the data sets required for the KPI UI
 */
const getKPIData = async (request) => {
  // get the last 2 returns cycles parameters
  const returnCycles = await helpers.returns.date.createReturnCycles().slice(-2);
  const [registrations, delegatedAccess, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData] = await Promise.all([
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
  // check all the data has returned
  const errors = [
    getErrorMessage(registrations, 'registrations'),
    getErrorMessage(delegatedAccess, 'delegatedAccess'),
    getErrorMessage(returnsDataMonthly, 'returnsDataMonthly'),
    getErrorMessage(returnsDataCycle1, 'returnsDataCycle1'),
    getErrorMessage(returnsDataCycle2, 'returnsDataCycle1'),
    getErrorMessage(licenceNamesData, 'licenceNamesData')
  ].filter(i => i);

  if (errors.length) {
    return Boom.notFound('Missing data for: ' + errors.join(', '));
  };

  // Map and return the data
  const returnsMonthly = mappers.mapReturnsDataMonthly(returnsDataMonthly);
  const returnsCycle1 = mappers.mapReturnsDataByCycle(returnsDataCycle1, returnCycles[1]);
  const returnsCycle2 = mappers.mapReturnsDataByCycle(returnsDataCycle2, returnCycles[0]);
  const licenceNames = mappers.mapLicenceNamesData(licenceNamesData);
  return { data: { registrations, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames } };
};

module.exports.getKPIData = getKPIData;
