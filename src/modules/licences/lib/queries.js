const { pool } = require('../../../lib/connectors/db');

/**
 * Gets recent communications for given licence number
 * @param  {String} licenceNumber - the licence to get comms for
 * @return {Promise}              - resolves with array of messages
 */
const getNotificationsForLicence = async (licenceNumber) => {
  const params = [`"${licenceNumber}"`];
  const query = `
    SELECT n.*, e.metadata as event_metadata, e.issuer
    FROM "water".scheduled_notification  n
    INNER JOIN "water".events e ON n.event_id = e.event_id
    WHERE n.licences @> $1
    AND n.notify_status IN ('delivered', 'received')
    AND n.status='sent'
    ORDER BY send_after DESC
    LIMIT 10`;

  const { rows } = await pool.query(query, params);

  return rows;
};

/**
 * Gets invoices associated to a licence
 * Used to display the Bills tab in the UI
 * @param  {String} licenceId
 * @param  {Int} startingPosition
 * @param  {Int} limit
 * @return {Promise}
 */
const getInvoicesForLicence = async (licenceId, startingPosition = 0, limit = 10) => {
  const query = `
  SELECT * from water.billing_invoices bi join 
  water.billing_invoice_licences bil on bil.billing_invoice_id = bi.billing_invoice_id 
  limit $3;
  `;

  const { rows } = await pool.query(query, [licenceId]);

  return rows;
};

module.exports = {
  getNotificationsForLicence,
  getInvoicesForLicence
};
