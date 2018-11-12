const Boom = require('boom');
const { getLicenceJson } = require('./transform-permit');
const { buildReturnsPacket } = require('./transform-returns');

const { getFormats, getLogs, getLogLines } = require('./lib/nald-returns-queries');

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
    return Boom.notFound(`The requested licence number could not be found`);
  } catch (err) {
    throw Boom.boomify(err, { statusCode: 400 });
  }
};

/**
 * For test purposes, builds returns data
 * @param {String} request.query.filter - a JSON encoded string with property 'licenceNumber'
 */
const getReturns = async (request, h) => {
  try {
    const filter = JSON.parse(request.query.filter);
    const data = await buildReturnsPacket(filter.licenceNumber);

    if (data) {
      return data;
    }
    return Boom.notFound(`The requested licence number could not be found`);
  } catch (err) {
    throw Boom.boomify(err, { statusCode: 400 });
  }
};

/**
 * For test purposes, gets returns formats for given licence number
 * @param {String} request.query.filter - JSON encoded filter
 */
const getReturnsFormats = async (request, h) => {
  try {
    const filter = JSON.parse(request.query.filter);
    const data = await getFormats(filter.licenceNumber);

    return data;
  } catch (err) {
    throw Boom.boomify(err, { statusCode: 400 });
  }
};

/**
 * For test purposes, gets returns formats for given licence number
 * @param {String} request.query - JSON encoded filter
 */
const getReturnsLogs = async (request, h) => {
  try {
    const filter = JSON.parse(request.query.filter);
    const { formatId, regionCode } = filter;
    const data = await getLogs(formatId, regionCode);
    return data;
  } catch (err) {
    throw Boom.boomify(err, { statusCode: 400 });
  }
};

/**
 * For test purposes, gets returns formats for given licence number
 * @param {String} request.query - JSON encoded filter
 */
const getReturnsLogLines = async (request, h) => {
  try {
    const filter = JSON.parse(request.query.filter);
    const { formatId, regionCode, dateFrom } = filter;
    const data = await getLogLines(formatId, regionCode, dateFrom);
    return data;
  } catch (err) {
    throw Boom.boomify(err, { statusCode: 400 });
  }
};

module.exports = {
  getLicence,
  getReturns,
  getReturnsFormats,
  getReturnsLogs,
  getReturnsLogLines
};
