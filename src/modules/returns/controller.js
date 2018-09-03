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

/**
 * Accepts posted return data from UI layer and submits back to returns service
 */
const postReturn = async (request, h) => {
  const data = request.payload;
  console.log(data);
  return data;
  // console.log(JSON.stringify(request.payload, null, 2));
  // return 'ok';
};

module.exports = {
  getReturn,
  postReturn
};
