const { chunk, groupBy } = require('lodash')
const returnsConnector = require('../../../../../lib/connectors/returns')
const documentsConnector = require('../../../../../lib/connectors/crm/documents')
const { createContacts } = require('../../../../../lib/models/factory/crm-contact-list')

const groupReturnsByLicenceNumber = returns => groupBy(returns, ret => ret.licence_ref)

/**
 * Given an object of returns keyed by licence number, loads a list of contacts
 * from the CRM and attaches
 * Returns an array
 * @param  {Object} groupedReturns
 * @return {Array}
 */
const getCRMContacts = async groupedReturns => {
  const arr = []
  const batches = chunk(Object.keys(groupedReturns), 100)
  for (const batch of batches) {
    const response = await documentsConnector.getLicenceContacts(batch)
    for (const row of response) {
      arr.push({
        licenceNumber: row.system_external_id,
        returns: groupedReturns[row.system_external_id],
        contacts: createContacts(row.contacts)
      })
    }
  }
  return arr
}

/**
 * Fetches all due returns from the returns service
 * The returns are then grouped by licence number, and the contacts loaded
 * from the CRM for each group.
 * The contact information is mapped to a standard water service ContactList
 * instance
 * @param {Array} excludeLicences - a list of licences to exclude from the
 *                                  list of returns
 * @param {Object} returnCycle
 * @param {Promise<Array>} an array of objects, each object represents a licence
 *                         number, with an array of return IDs due for that
 *                         licence, and a ContactList instance
 */
const getReturnContacts = async (excludeLicences, returnCycle) => {
  // Load due returns in current cycle from return service
  const returns = await returnsConnector.getCurrentDueReturns(excludeLicences, returnCycle)

  // Group returns by licence number
  const groupedReturns = groupReturnsByLicenceNumber(returns)

  // Combine with contacts for each licence in grouped list
  return getCRMContacts(groupedReturns)
}

exports.getReturnContacts = getReturnContacts
