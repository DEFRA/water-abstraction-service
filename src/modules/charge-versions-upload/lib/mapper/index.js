const csvParser = require('../csv-adapter/csv-parser')
const { camelCase, sortBy } = require('lodash')
const chargeVersionMapper = require('./chargeVersionMapper')
const { jobName } = require('../../jobs/update-charge-information-to-json')
const eventsService = require('../../../../lib/services/events')
const helpers = require('../helpers')

const mapToRowObject = headers => row => row.reduce((acc, column, index) => {
  return { ...acc, [headers[index]]: column }
}, {})

/**
 * Maps a CSV file in string form to an array of return objects
 * @param  {String}  csvStr - CSV file in string form
 * @param  {Object}  user - User uploading the file
 * @param  {Event}  event
 * @return {Promise<Array>} resolves with array of return objects
 */
const mapCsv = async (csvStr, user, event) => {
  const data = await csvParser.parseCsv(csvStr)
  const { mapToChargeVersion } = chargeVersionMapper

  const [headers, ...rows] = data

  if (!event.metadata) {
    event.metadata = {}
  }

  event.metadata.rows = rows.length
  await eventsService.update(event)

  // Convert the fields in the csv rows into key value pairs with the csv headings as the keys converted to camel case.
  // Then sort by the licence number and group.
  const rowObjects = sortBy(
    rows.map(mapToRowObject(headers.map(header => camelCase(header)))),
    ['licenceNumber', 'chargeReferenceDetailsChargeElementGroup']
  )

  const chargeVersions = []
  let groupByLicenceNumber = []
  let groupByElementGroup = []

  while (rowObjects.length) {
    await helpers.updateEventStatus(event, `${rowObjects.length} rows remaining to map to a charge version`, jobName)
    const currentRow = rowObjects.shift()
    const nextRow = rowObjects.length && rowObjects[0]
    groupByElementGroup.push(currentRow)
    if (nextRow.licenceNumber !== currentRow.licenceNumber) {
      groupByLicenceNumber.push(groupByElementGroup)
      const chargeVersion = await mapToChargeVersion(groupByLicenceNumber, user, currentRow.chargeInformationBillingAccount)
      chargeVersions.push(chargeVersion)
      groupByElementGroup = []
      groupByLicenceNumber = []
    } else if (
      currentRow.chargeReferenceDetailsChargeElementGroup === 'A' ||
      currentRow.chargeReferenceDetailsChargeElementGroup !== nextRow.chargeReferenceDetailsChargeElementGroup
    ) {
      groupByLicenceNumber.push(groupByElementGroup)
      groupByElementGroup = []
    }
  }
  return chargeVersions
}

exports.mapCsv = mapCsv
