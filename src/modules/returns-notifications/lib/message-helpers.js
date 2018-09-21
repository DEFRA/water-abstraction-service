/**
 * Create job data for a returns notification message regarding a return to
 * be placed on the message queue
 * @param {Object} ret - return row
 * @param {Object} event - event
 */
const getJobData = (ret, event, messageRef) => {
  return {
    returnId: ret.return_id,
    licenceNumber: ret.licence_ref,
    eventId: event.event_id,
    messageRef
  };
};

module.exports = {
  getJobData
};
