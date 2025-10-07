/*
  Add overall_status and status_counts columns to events table

  https://eaflood.atlassian.net/browse/WATER-5306

  The overall_status column is populated with the overall status of related notifications. This status is calculated
  based on the statuses of all notifications associated with an event. It provides a quick reference to the overall
  status of the event without needing to check each notification individually.

  The status_counts column is a JSONB object that contains counts of each notification status type related to the event.
*/

BEGIN;

ALTER TABLE water.events ADD COLUMN overall_status varchar(255);
ALTER TABLE water.events ADD COLUMN status_counts jsonb;

UPDATE water.events e
SET
  overall_status = os.overall_status,
  status_counts = os.status_counts
FROM (
  SELECT
    sn.event_id,
    CASE
      WHEN COUNT(*) FILTER (WHERE sn.status = 'returned') > 0 THEN 'returned'
      WHEN COUNT(*) FILTER (WHERE sn.status = 'error') > 0 THEN 'error'
      WHEN COUNT(*) FILTER (WHERE sn.status = 'pending') > 0 THEN 'pending'
      ELSE 'sent'
    END AS overall_status,
    jsonb_build_object(
      'returned', COUNT(*) FILTER (WHERE sn.status = 'returned'),
      'error', COUNT(*) FILTER (WHERE sn.status = 'error'),
      'pending', COUNT(*) FILTER (WHERE sn.status = 'pending'),
      'sent', COUNT(*) FILTER (WHERE sn.status = 'sent')
    ) AS status_counts
  FROM water.scheduled_notification sn
  GROUP BY sn.event_id
) os
WHERE e.type = 'notification'
AND e.event_id = os.event_id;

COMMIT;
