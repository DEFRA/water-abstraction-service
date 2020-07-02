
const crm = require('../../../lib/connectors/crm/kpi-reporting');
const idm = require('../../../lib/connectors/idm/kpi-reporting');
const events = require('../../../lib/services/events');
const returns = require('../../../lib/connectors/returns');

const errorHandler = (error) => {
  if (error.statusCode === 404) {
    return null;
  }
  return error;
};

const getIDMRegistrationsData = async () => {
  try {
    const { data } = await idm.getKPIRegistrations();
    return data;
  } catch (err) {
    return errorHandler(err);
  }
};

// Delegated access - CRM 1.0
const getCRMDelegatedAccessData = async () => {
  try {
    const { data } = await crm.getKPIAccessRequests();
    return data;
  } catch (err) {
    return errorHandler(err);
  }
};

// Naming licences data - events table
const getLicenceNamesData = async () => {
  const data = await events.getKPILicenceNames();
  return data;
};

// Returns Monthly data - events table
const getReturnsDataByMonth = async () => {
  const data = await events.getKPIReturnsMonthly();
  return data;
};

const getReturnsDataByCycle = async (startDate, endDate, isSummer) => {
  try {
    const { data: [data] } = await returns.getKPIReturnsByCycle(startDate, endDate, isSummer);
    return data;
  } catch (err) {
    return errorHandler(err);
  }
};

module.exports.getCRMDelegatedAccessData = getCRMDelegatedAccessData;
module.exports.getIDMRegistrationsData = getIDMRegistrationsData;
module.exports.getReturnsDataByMonth = getReturnsDataByMonth;
module.exports.getReturnsDataByCycle = getReturnsDataByCycle;
module.exports.getLicenceNamesData = getLicenceNamesData;
