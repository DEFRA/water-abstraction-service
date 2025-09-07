/*
  https://eaflood.atlassian.net/browse/WATER-5232

  Water abstraction alert notifications created by the legacy code contain the relevant `licenceId` in the
  `water.scheduled_notification` `personalisation` field. Those created by
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system) don't.

  This discrepancy has caused the last alert data we show in the 'view licence monitoring stations' page to be incorrect
  because it was depending on the `licenceId` being present. It turns out that it shouldn't have been getting the
  information in that way, but we still want to keep the records consistent.

  This one-off data migration adds the missing `licenceId` to those water abstraction alert notification records that
  don't have it.

  Before we run it, though, we delete any with a status of 'draft'. These are a hangover of the legacy code, which would
  commit records to the DB as part of the setup process. If users abandoned the process, though, the draft notifications
  would remain.

  The previous team didn't realise how often this would happen. We've found the users often like to get to the last page
  in the process so they can see what would be generated, but then cancel so they can go deal with any issues found.

  At the time of writing, there are 525,000 notifications, of which 339,000 are 'draft'!

  Now that we've taken over most notification processes, and we want to run queries against the table, it is prudent to
  delete them.
*/

DELETE FROM water.scheduled_notification sn WHERE sn.status = 'draft';

WITH subquery AS (
  SELECT
    sn.id,
    l.licence_id
  FROM
    water.scheduled_notification sn
  INNER JOIN water.licences l
    ON l.licence_ref = sn.licences->>0
  WHERE
    sn.message_ref LIKE 'water_abstraction_alert%'
    AND NOT( sn.personalisation ? 'licenceId' )
)
UPDATE water.scheduled_notification
SET personalisation = personalisation || ('{"licenceId":"' || subquery.licence_id || '"}' )::jsonb
FROM subquery;
