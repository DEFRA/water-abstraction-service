const { chunk, groupBy } = require('lodash');
const returnsConnector = require('../../../../lib/connectors/returns');
const documentsConnector = require('../../../../lib/connectors/crm/documents');
const { createContacts } = require('../../../../lib/models/factory/crm-contact-list');

const groupReturnsByLicenceNumber = returns => groupBy(returns, ret => ret.licence_ref);

/**
 * Given an object of returns keyed by licence number, loads a list of contacts
 * from the CRM and attaches
 * Returns an array
 * @param  {Object} groupedReturns
 * @return {Array}
 */
const getCRMContacts = async groupedReturns => {
  const arr = [];
  const batches = chunk(Object.keys(groupedReturns), 100);
  for (let batch of batches) {
    const response = await documentsConnector.getLicenceContacts(batch);
    for (let row of response) {
      arr.push({
        licenceNumber: row.system_external_id,
        returns: groupedReturns[row.system_external_id],
        contacts: createContacts(row.contacts)
      });
    }
  }
  return arr;
};

const getReturnContacts = async excludeLicences => {
  // Load due returns in current cycle from return service
  const returns = await returnsConnector.getCurrentDueReturns(excludeLicences);

  // Group returns by licence number
  const groupedReturns = groupReturnsByLicenceNumber(returns);

  // Combine with contacts for each licence in grouped list
  return getCRMContacts(groupedReturns);
};

exports.getReturnNotificationContacts = getReturnContacts;
