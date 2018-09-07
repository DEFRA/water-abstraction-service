const { persistReturnData } = require('./lib/api-connector');
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

module.exports = {
  getReturn,
  postReturn
};
