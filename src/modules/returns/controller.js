const returns = require('../../lib/connectors/returns');
const { mapReturnToModel, mapReturnToVersion, mapReturnToLines } = require('./lib/model-returns-mapper');
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

  // Prepare objects for saving
  const version = mapReturnToVersion(ret);
  const lines = mapReturnToLines(ret, version);

  // @TODO POST to returns service
  try {
    await returns.versions.create(version);
    await returns.lines.create(lines);
  } catch (error) {
    return h.response({
      error,
      data: null
    }).code(500);
  }

  return {
    error: null,
    data: {
      version,
      lines
    }
  };
};

module.exports = {
  getReturn,
  postReturn
};
