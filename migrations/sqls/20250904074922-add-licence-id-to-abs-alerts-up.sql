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
*/
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
