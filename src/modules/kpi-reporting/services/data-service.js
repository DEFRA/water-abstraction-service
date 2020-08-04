
const crm = require('../../../lib/connectors/crm/kpi-reporting');
const idm = require('../../../lib/connectors/idm/kpi-reporting');
const events = require('../../../lib/services/events');
const returns = require('../../../lib/connectors/returns');

const getDataFromResponseEnvelope = async connectorFunc => {
  try {
    const { data } = await connectorFunc();
    return data;
  } catch (err) {
    if (err.statusCode === 404) {
      return null;
    }
    throw err;
  }
};

const getIDMRegistrationsData = async () => getDataFromResponseEnvelope(idm.getKPIRegistrations);
const getCRMDelegatedAccessData = async () => getDataFromResponseEnvelope(crm.getKPIAccessRequests);

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
    if (err.statusCode === 404) {
      return null;
    }
    return err;
  }
};

module.exports.getCRMDelegatedAccessData = getCRMDelegatedAccessData;
module.exports.getIDMRegistrationsData = getIDMRegistrationsData;
module.exports.getReturnsDataByMonth = getReturnsDataByMonth;
module.exports.getReturnsDataByCycle = getReturnsDataByCycle;
module.exports.getLicenceNamesData = getLicenceNamesData;
