/*
  Delete notices with no notifications

  https://eaflood.atlassian.net/browse/WATER-5332

  Whilst dealing with WATER-5329 , and having applied the migration in [Fix notification status + amend prev.
  migration](https://github.com/DEFRA/water-abstraction-service/pull/2730), we found there were notices in the view
  notices page that were displaying without a status.

  When we investigated, we found that the migration script in PR #2730 had failed to apply an 'overall status' to
  specific notices. This was because those notices were not linked to any notifications.

  This was in our non-prod environments, so we checked if this was an issue for `production`. Sure enough, there are 207
  notices which have no notifications.

  It looks like they are the result of something having failed in the legacy code (there are none linked to notices
  created by the [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) since it took over).

  They are effectively 'corrupt' notices that have no meaning and need to be deleted.
*/

DELETE FROM water.events e
WHERE
  e."type" = 'notification'
  AND NOT EXISTS (
    SELECT 1 FROM water.scheduled_notification sn WHERE sn.event_id = e.event_id
  );
