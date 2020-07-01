'use-strict';
const helpers = require('@envage/water-abstraction-helpers');

const crm = require('../../lib/connectors/crm/kpi-reporting');
const idm = require('../../lib/connectors/idm');
const events = require('../../lib/services/events');
const returns = require('../../lib/connectors/returns');
const Boom = require('@hapi/boom');
const mappers = require('./lib/mappers');

// generates a combined error message for the data sets
const confirmDataReturned =
(idmData, delegatedAccess, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData) => {
  return (idmData === null ? 'IDM for registrations, ' : '') +
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
  const { data: idmData } = await idm.getKPIAccessRequests();

  // Delegated access - CRM 1.0
  const { data: delegatedAccess } = await crm.getKPIAccessRequests();

  // Returns Monthly data - events table
  const returnsDataMonthly = await events.getKPIReturnsMonthly();

  // Returns by cycle for last 2 cycles
  const returnCycle = helpers.returns.date.createReturnCycles().slice(-2);
  const { data: returnsDataCycle1 } = await returns.getKPIReturnsByCycle(returnCycle[1].startDate, returnCycle[1].endDate, returnCycle[1].isSummer);
  const { data: returnsDataCycle2 } = await returns.getKPIReturnsByCycle(returnCycle[0].startDate, returnCycle[0].endDate, returnCycle[0].isSummer);

  // Naming documents - events table
  const licenceNamesData = await events.getKPILicenceNames();

  // check all the data has returned
  const message = confirmDataReturned(idmData, delegatedAccess, returnsDataMonthly, returnsDataCycle1, returnsDataCycle2, licenceNamesData);
  if (message.length > 0) {
    return Boom.notFound(`Missing data: ${message}`);
  };
  // Map and return the data
  const returnsMonthly = mappers.mapReturnsDataMonthly(returnsDataMonthly);
  const returnsCycle1 = mappers.mapReturnsDataByCycle(returnsDataCycle1[0], returnCycle[1]);
  const returnsCycle2 = mappers.mapReturnsDataByCycle(returnsDataCycle2[0], returnCycle[0]);
  const licenceNames = mappers.mapLicenceNamesData(licenceNamesData);
  return { data: { idmData, delegatedAccess, returnsMonthly, returnsCycle1, returnsCycle2, licenceNames } };
};

module.exports.getKPIData = getKPIData;
