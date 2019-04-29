const { compact } = require('lodash');

/**
 * Creates the notification address in the format expected by existing
 * notifications for the supplied Contact model
 * @param  {Contact} contact
 * @return {Object} contact details object for personalisation
 */
const mapContactAddress = (contact) => {
  const { postcode } = contact;

  const addressLines = [
    contact.getFullName(),
    contact.addressLine1,
    contact.addressLine2,
    contact.addressLine3,
    contact.addressLine4,
    contact.town,
    contact.county,
    contact.country
  ];

  return compact(addressLines).reduce((acc, line, index) => ({
    ...acc,
    [`address_line_${index + 1}`]: line
  }), { postcode });
};

exports.mapContactAddress = mapContactAddress;
