/*
  Correct the status of legacy notifications, then add overall_status and status_counts columns to events table

  - https://eaflood.atlassian.net/browse/WATER-5306
  - https://eaflood.atlassian.net/browse/WATER-5328
  - https://eaflood.atlassian.net/browse/WATER-5329

  This migration originally started as just adding the new columns then populating them based on the existing status of
  notifications.

  Then when working to enable water-abstraction-system to view any notification no matter the status, we came across
  ones which had a Notify status of 'cancelled', but a status of 'sent'.

  > These are letters where the user has cancelled them in the Notify dashboard before they were sent to the provider.

  We realised we needed to capture these in our overall status and counts, but that the existing records would need to
  be updated before this migration script kicked in.

  However, we then realised we had a bigger issue! Essentially, 'sent' for legacy notifications just means the
  notification got to Notify. It doesn't mean that Notify has actually sent it. But in new system notifications status
  does relate to whether Notify has managed to send the notification successfully.

  We found thousands of notifications with a status of 'sent' but a notify status that means error/failure.

  So, now this migration script is

  - Update the status of existing notifications to match the 'system' understanding
  - Do a bit of housekeeping and update the existing `created` and `modified` columns to default to the current date and time
  - Add the new columns to `water.events` (if they don't already exist)
  - Run the query that sets `overall_status` and `status_counts`, now with 'cancelled' included

  The overall_status column is populated with the overall status of related notifications. This status is calculated
  based on the statuses of all notifications associated with an event. It provides a quick reference to the overall
  status of the event without needing to check each notification individually.

  The status_counts column is a JSONB object that contains counts of each notification status type related to the event.
*/

BEGIN;

-- 1. Update the status of existing notifications to error where we know notify has failed to send them
UPDATE water.scheduled_notification
SET status = 'error'
WHERE
  "status" = 'sent'
  AND notify_status IN (
    'permanent-failure',
    'technical-failure',
    'temporary-failure',
    'validation-failed'
  );

-- 2. Update the status of the existing cancelled notifications
UPDATE water.scheduled_notification SET status = 'cancelled' WHERE "status" = 'sent' AND notify_status = 'cancelled';

-- 3. Update the existing created column to default to the current date and time and to no longer allow nulls
ALTER TABLE IF EXISTS water.events ALTER COLUMN created SET DEFAULT now();
ALTER TABLE IF EXISTS water.events ALTER COLUMN created SET NOT NULL;

-- 4. Update the existing modified column to default to the current date and time and to no longer allow nulls
ALTER TABLE IF EXISTS water.events ALTER COLUMN modified SET DEFAULT now();
UPDATE water.events SET modified = created WHERE modified IS NULL;
ALTER TABLE IF EXISTS water.events ALTER COLUMN modified SET NOT NULL;

-- 5. Add our new overall_status and status_counts columns
ALTER TABLE IF EXISTS water.events ADD COLUMN IF NOT EXISTS overall_status VARCHAR(255);
ALTER TABLE IF EXISTS water.events ADD COLUMN IF NOT EXISTS status_counts jsonb;

-- 6. Run script to populate the new columns for existing events
UPDATE water.events e
SET
  overall_status = os.overall_status,
  status_counts = os.status_counts
FROM (
  SELECT
    sn.event_id,
    (CASE
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE sn.status = 'cancelled') THEN 'cancelled'
      WHEN COUNT(*) FILTER (WHERE sn.status = 'returned') > 0 THEN 'returned'
      WHEN COUNT(*) FILTER (WHERE sn.status = 'error') > 0 THEN 'error'
      WHEN COUNT(*) FILTER (WHERE sn.status = 'pending') > 0 THEN 'pending'
      ELSE 'sent'
    END) AS overall_status,
    jsonb_build_object(
      'cancelled', COUNT(*) FILTER (WHERE sn.status = 'cancelled'),
      'error', COUNT(*) FILTER (WHERE sn.status = 'error'),
      'pending', COUNT(*) FILTER (WHERE sn.status = 'pending'),
      'returned', COUNT(*) FILTER (WHERE sn.status = 'returned'),
      'sent', COUNT(*) FILTER (WHERE sn.status = 'sent')
    ) AS status_counts
  FROM
    water.scheduled_notification sn
  GROUP BY
    sn.event_id
) os
WHERE
  e.type = 'notification'
  AND e.event_id = os.event_id;

-- 7. Update the legacy error count in the event's metadata just to ensure consistency
UPDATE water.events e
SET
  metadata = jsonb_set(e.metadata,'{error}', to_jsonb((status_counts->>'error')::integer), true),
  modified = CURRENT_TIMESTAMP
WHERE
  e.type = 'notification'
  AND e.status_counts IS NOT NULL;

COMMIT;
