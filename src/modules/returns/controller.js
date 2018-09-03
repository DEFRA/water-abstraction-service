const { createModel, mapReturnToVersion, mapReturnToLines } = require('./lib/helpers');
const { getReturnData } = require('./lib/facade');

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request, h) => {
  const { returnId } = request.query;

  const { return: ret, version, lines } = await getReturnData(returnId);

  return createModel(ret, version, lines);
};

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request, h) => {
  const ret = request.payload;

  // Prepare objects for saving
  const version = mapReturnToVersion(ret);
  const lines = mapReturnToLines(ret);

  // @TODO POST to returns service
  // await returns.versions.create(version);
  // await returns.lines.create(lines);
  console.log(version, lines);

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
