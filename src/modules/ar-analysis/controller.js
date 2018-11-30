const Boom = require('boom');
const { updateLicenceRow } = require('./lib/update-licence-row');

/**
 * A webhook that updates the AR licence analysis table stored in the water service
 */
const getUpdateLicence = async (request, h) => {
  const { licenceRef } = request.params;

  const result = await updateLicenceRow(licenceRef);

  if (result) {
    return result;
  }
  throw Boom.badImplementation(`Unable to update AR licence analysis row for ${licenceRef}`);
};

module.exports = {
  getUpdateLicence
};
