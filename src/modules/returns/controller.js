const { createModel } = require('./helpers');
const { fetchReturn, fetchVersion, fetchLines } = require('./api-connector');

/**
 * A controller method to get a unified view of a return, to avoid handling
 * in UI layer
 */
const getReturn = async (request, h) => {
  const { returnId } = request.query;

  const ret = await fetchReturn(returnId);
  const version = await fetchVersion(returnId);
  const lines = await fetchLines(returnId, version.version_id);

  return createModel(ret, version, lines);
};

module.exports = {
  getReturn
};
