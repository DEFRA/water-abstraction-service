const { persistReturnData } = require('./lib/api-connector');
const { mapReturnToModel } = require('./lib/model-returns-mapper');
const { getReturnData } = require('./lib/facade');

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request, h) => {
  const { returnId } = request.query;

  const { return: ret, version, lines } = await getReturnData(returnId);

  return mapReturnToModel(ret, version, lines);
};

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request, h) => {
  const ret = request.payload;

  await persistReturnData(ret);

  return {
    error: null
  };
};

module.exports = {
  getReturn,
  postReturn
};
