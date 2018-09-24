/**
 * Parses variables used by the controller out of the request
 * @param {Object} request
 * @return {Object} controller variables
 */
const parseRequest = (request) => {
  const { notificationId: messageRef } = request.params;

  // Get params to query returns service
  const { filter, issuer, name } = request.payload;
  const columns = ['return_id', 'licence_ref'];
  const sort = {};

  return {
    messageRef,
    filter,
    issuer,
    name,
    columns,
    sort
  };
};

module.exports = {
  parseRequest
};
