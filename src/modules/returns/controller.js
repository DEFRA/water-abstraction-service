const { persistReturnData, patchReturnData } = require('./lib/api-connector');
const { mapReturnToModel } = require('./lib/model-returns-mapper');
const { getReturnData } = require('./lib/facade');
const { eventFactory } = require('./lib/event-factory');
const { repository: eventRepository } = require('../../controllers/events');

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request, h) => {
  const { returnId, versionNumber } = request.query;

  const { return: ret, version, lines, versions } = await getReturnData(returnId, versionNumber);

  return mapReturnToModel(ret, version, lines, versions);
};

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request, h) => {
  const ret = request.payload;

  // Persist data to return service
  const returnServiceData = await persistReturnData(ret);

  // Log event in water service event log
  const event = eventFactory(ret, returnServiceData.version);
  await eventRepository.create(event);

  return {
    error: null
  };
};

/**
 * Allows the patching of return header data
 * @param {String} request.payload.returnId - the return_id in the returns.returns table
 * @param {String} [request.payload.status] - return status
 * @param {String} [request.payload.receivedDate] - date received, ISO 8601 YYYY-MM-DD
 * @return {Promise} resolves with JSON payload
 */
const patchReturnHeader = async (request, h) => {
  const data = await patchReturnData(request.payload);

  // Log event in water service event log
  const eventData = {
    ...request.payload,
    licenceNumber: data.licence_ref
  };
  const event = eventFactory(eventData, null, 'return.status');
  await eventRepository.create(event);

  return {
    returnId: data.return_id,
    status: data.status,
    receivedDate: data.received_date
  };
};

module.exports = {
  getReturn,
  postReturn,
  patchReturnHeader
};
