/* Reverts the change by adding the column back in and running the same population script */

ALTER TABLE IF EXISTS water.licence_gauging_stations ADD COLUMN notification_id uuid;

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
