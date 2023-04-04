'use strict'

/**
 * Reduces the number of address lines to 6 (the max in Notify)
 * The first line is not altered as it contains the recipient name
 * @param  {Array} lines
 * @return {Array}
 */
const reduceAddressLines = lines => {
  const compacted = lines.filter(x => x)
  let index = 1
  while (compacted.length > 6) {
    const newLine = compacted.slice(index, index + 2).join(', ')
    compacted.splice(index, 2, newLine)
    index++
  }
  return compacted
}

/**
 * Creates the notification address in the format expected by existing
 * notifications for the supplied Contact model
 * @param  {Contact} contact
 * @return {Object} contact details object for personalisation
 */
const mapContactAddress = (contact) => {
  const { postcode } = contact

  const addressLines = reduceAddressLines([
    contact.getFullName(),
    contact.addressLine1,
    contact.addressLine2,
    contact.addressLine3,
    contact.addressLine4,
    contact.town,
    contact.county,
    contact.country
  ])

  return addressLines.reduce((acc, line, index) => ({
    ...acc,
    [`address_line_${index + 1}`]: line
  }), { postcode })
}

exports.mapContactAddress = mapContactAddress
