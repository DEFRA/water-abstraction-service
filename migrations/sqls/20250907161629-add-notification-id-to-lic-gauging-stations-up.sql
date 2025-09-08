/*
  https://eaflood.atlassian.net/browse/WATER-5232

  We've spotted that the last alert details in the monitoring station page do not align with the ones shown on the view
  licence monitoring stations page in some cases.

  In [Fix last alert info in view lic. mon. station page](https://github.com/DEFRA/water-abstraction-system/pull/2354),
  we cover what the problem is, and implement a fix.

  We also ensured that the water abstraction alert notifications get updated with the [missing licence
  IDs](https://github.com/DEFRA/water-abstraction-service/pull/2717).

  But at the core of the issue is the fact that the `water.licence_gauging_stations` table is not linked to the
  `water.scheduled_notification` table.

  The legacy code, when creating an abstraction alert, would record the type and date in the `licence_gauging_stations`
  record. When we took over the process, we improved it by recording the details only when we had received confirmation
  from **Notify** that the email or letter had been sent successfully.

  But we still don't actually record the notification ID. The issue we found was in part caused by how complex it was
  for the new view licence monitoring stations page to find the relevant notification records.

  If we captured the notification ID of the last abstraction alert notification sent, these issues would disappear. In
  fact, `status` and `status_updated` would become redundant (though, because that will break our downstream reporting
  service, removing them will have to be done at another time).

  We update the `licence_gauging_station` in our **notification-status** job, when it confirms the notification was
  sent. Its problem is that it has to rely on the notification's `personalisation` JSONB field containing the
  `licenceGaugingStationId`. Again, we are reliant on a property in a JSONB field rather than a proper column value.

  So, this change is primarily about adding columns.

  - Add `notification_id` to the `licence_gauging_stations` table
  - Add `licence_gauging_station_id` to the `scheduled_notification` table

  We've also spotted that we have been consistent in how we populate the JSONB field for new abstraction alerts (another
  reason to avoid them). We've fixed the functionality in
  [water-abstraction-system](https://github.com/DEFRA/water-abstraction-system/pull/2369). However, this migration
  script also corrects the records to restore consistency.

  With the fix part done, we add the columns, then populate them for the existing records.
*/

-- 1. We have been inconsistent with what we name the properties in the personalisation. We should have stuck to the
-- old name until we have taken over the DB 'proper'. So, we update the new water abstraction alert notifications we
-- have created, to use `licenceGaugingStationId` instead of `licenceMonitoringStationId` in the JSONB object
UPDATE water.scheduled_notification
SET personalisation = jsonb_set(
    personalisation - 'licenceMonitoringStationId', -- drop old key
    '{licenceGaugingStationId}',            -- new key
    personalisation->'licenceMonitoringStationId'   -- reuse value
)
WHERE personalisation ? 'licenceMonitoringStationId';

-- 2. Adding the missing sending_alert_type property. Fortunately, we record it in the event record so can extract it
-- from there
WITH subquery AS (
  SELECT
    e.event_id,
    e.metadata->'options'->>'sendingAlertType' AS sending_alert_type
  FROM
    water.events e
  WHERE
    e."type" = 'notification'
    AND e.subtype = 'waterAbstractionAlerts'
    AND e.metadata->'options'->>'sendingAlertType' IS NOT NULL
)
UPDATE water.scheduled_notification AS sn
SET personalisation = personalisation || ('{"sending_alert_type":"' || subquery.sending_alert_type || '"}' )::jsonb
FROM subquery
WHERE sn.event_id = subquery.event_id;

-- 3. Correct the alertType property. In the new abstraction alerts we've created we were storing the sending alert
-- type in this field, when it should be the alert type of the relevant licence gauging station
WITH subquery AS (
  SELECT
    lgs.licence_gauging_station_id,
    lgs.alert_type
  FROM
    water.licence_gauging_stations lgs
)
UPDATE water.scheduled_notification AS sn
SET personalisation = personalisation || ('{"alertType":"' || subquery.alert_type || '"}' )::jsonb
FROM subquery
WHERE (sn.personalisation->>'licenceGaugingStationId')::uuid = subquery.licence_gauging_station_id;

-- 4. Rename licence_ref to licenceRef. New records only.
-- The legacy code would duplicate the the following 3 fields in both formats. We're not going to repeat that
-- duplication, so we'll just stick with one of the fields. Unfortunately, we went for the non-javascript snake_case
-- style originally. Going forward we'll create the notifications using camelCase.
UPDATE water.scheduled_notification AS sn
SET personalisation = jsonb_set(
    personalisation - 'licence_ref',
    '{licenceRef}',
    personalisation->'licence_ref'
)
WHERE
  personalisation ? 'licence_ref'
  AND NOT (personalisation ? 'licenceRef');

-- 5. Rename threshold_unit to thresholdUnit. New records only.
UPDATE water.scheduled_notification AS sn
SET personalisation = jsonb_set(
    personalisation - 'threshold_unit',
    '{thresholdUnit}',
    personalisation->'threshold_unit'
)
WHERE
  personalisation ? 'threshold_unit'
  AND NOT (personalisation ? 'thresholdUnit');

-- 6. Rename threshold_value to thresholdValue. New records only.
UPDATE water.scheduled_notification AS sn
SET personalisation = jsonb_set(
    personalisation - 'threshold_value',
    '{thresholdValue}',
    personalisation->'threshold_value'
)
WHERE
  personalisation ? 'threshold_value'
  AND NOT (personalisation ? 'thresholdValue');

-- 7. Add the new notification_id column to the licence_gauging_stations table
ALTER TABLE water.licence_gauging_stations ADD COLUMN notification_id UUID;

-- 8. Add the new licence_gauging_station_id column to the scheduled_notification table
ALTER TABLE water.scheduled_notification ADD COLUMN licence_gauging_station_id UUID;

-- 9. Copy licenceGaugingStationId out of personalisation into licence_gauging_station_id
UPDATE water.scheduled_notification AS sn
SET licence_gauging_station_id = (personalisation->>'licenceGaugingStationId')::uuid
WHERE
  personalisation ? 'licenceGaugingStationId';

-- 9. Set notification_id for existing records, plus ensure their status and date_status_updated matches the latest
-- notification
UPDATE water.licence_gauging_stations AS lgs
SET
  notification_id = alerts.id,
  status = alerts.sending_alert_type::water.water_abstraction_restriction_status,
  date_status_updated = alerts.date_created
FROM (
  SELECT DISTINCT ON (sn.licence_gauging_station_id)
    sn.id,
    sn.licence_gauging_station_id,
    sn.date_created,
    sn.personalisation->>'sending_alert_type' AS sending_alert_type
  FROM
    water.scheduled_notification sn
  WHERE
    sn.licence_gauging_station_id IS NOT NULL
    AND sn.date_created IS NOT NULL
    AND sn.personalisation->>'sending_alert_type' IS NOT NULL
    AND sn.status = 'sent'
  ORDER BY
    sn.licence_gauging_station_id,
    sn.date_created DESC
) AS alerts
WHERE
  lgs.licence_gauging_station_id = alerts.licence_gauging_station_id;
