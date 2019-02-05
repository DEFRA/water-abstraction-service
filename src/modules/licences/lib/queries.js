const { pool } = require('../../../lib/connectors/db');

/**
 * Gets recent communications for given licence number
 * @param  {String} licenceNumber - the licence to get comms for
 * @return {Promise}              - resolves with array of messages
 */
const getNotificationsForLicence = async (licenceNumber) => {
  const params = [`"${licenceNumber}"`];
  const query = `SELECT n.*, e.metadata as event_metadata, e.issuer
    FROM "water".scheduled_notification  n
    LEFT JOIN "water".events e ON n.event_id = e.event_id
    WHERE n.licences @> $1
    AND n.status='sent'
    ORDER BY send_after DESC
    LIMIT 10`;

  const { rows } = await pool.query(query, params);

  return rows;
};

module.exports = {
  getNotificationsForLicence
};
