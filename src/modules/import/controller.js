const { badRequest, notFound } = require('boom');
const { getLicenceJson } = require('./transform-permit.js');

/**
 * For test purposes, builds licence from the data in the NALD import
 * tables.  This is used in the NALD import unit test
 * @param {String} request.query.filter - a JSON encoded string with property 'licenceNumber'
 */
const getLicence = async (request, h) => {
  try {
    const filter = JSON.parse(request.query.filter);
    const data = await getLicenceJson(filter.licenceNumber);

    if (data) {
      return data;
    }
    return notFound(`The requested licence number could not be found`);
  } catch (err) {
    throw badRequest(err);
  }
};

module.exports = {
  getLicence
};
