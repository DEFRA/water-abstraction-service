/*
  https://eaflood.atlassian.net/browse/WATER-5395

  We knew that the legacy service had a job for updating the status of notifications after they were sent. As we took control of sending notices, this job needed to be disabled.

  We thought we'd done that in [Add enable batch notification job feature toggle](https://github.com/DEFRA/water-abstraction-service/pull/2680), but it turns out not to be the case.

  We have examples of new fields we've added to the `water.events` table being set to NULL, and fields related to checking the status in `water.scheduled_notification` being populated even though this job is supposed to be disabled.

  After checking, it appears that the simple act of registering a 'job', which is configured to repeat, will automatically start it, overriding what we did with `src/lib/queue-manager/start-up-jobs-service.js`.

  We need the legacy service to leave all notices (returns invitations and reminders, paper returns and abstraction alerts) alone.

  Account-related emails are still sent through the service, so they should be left as is. But as they are not linked to events, the refresh event (`src/modules/batch-notifications/lib/jobs/refresh-event.js`) job is redundant. The check status job (`src/modules/batch-notifications/lib/jobs/check-status.js`) should ignore anything that isn't account-related. The same applies to the send message (`src/modules/batch-notifications/lib/jobs/send-message.js`) job.

  So, we updated the three 'batch-notifications' jobs to only look at account-related notifications.

  We also add this migration script to re-populate the `water.events` we think these jobs have messed with.
*/

UPDATE water.events e
SET
  metadata = jsonb_set(
    e.metadata,
    '{error}',
    to_jsonb(os.error_count),
    true
    ),
  overall_status = os.overall_status,
  status_counts = os.status_counts,
  modified = NOW()
FROM (
  SELECT
    n.event_id,
    COUNT(*) FILTER (WHERE n.status = 'error') AS error_count,
    CASE
      WHEN COUNT(*) = COUNT(*) FILTER (WHERE n.status = 'cancelled') THEN 'cancelled'
      WHEN COUNT(*) FILTER (WHERE n.status = 'returned') > 0 THEN 'returned'
      WHEN COUNT(*) FILTER (WHERE n.status = 'error') > 0 THEN 'error'
      WHEN COUNT(*) FILTER (WHERE n.status = 'pending') > 0 THEN 'pending'
      ELSE 'sent'
    END AS overall_status,
    jsonb_build_object(
      'cancelled', COUNT(*) FILTER (WHERE n.status = 'cancelled'),
      'error', COUNT(*) FILTER (WHERE n.status = 'error'),
      'pending', COUNT(*) FILTER (WHERE n.status = 'pending'),
      'returned', COUNT(*) FILTER (WHERE n.status = 'returned'),
      'sent', COUNT(*) FILTER (WHERE n.status = 'sent')
    ) AS status_counts
  FROM water.scheduled_notification n
  GROUP BY n.event_id
) os
WHERE e.type = 'notification'
AND e.event_id = os.event_id
AND e.overall_status IS NULL;
