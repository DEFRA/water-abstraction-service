exports.findGaugingStationWithLinkedLicences = `select
lgs.abstraction_period_start_day,
  lgs.abstraction_period_start_month,
  lgs.abstraction_period_end_day,
  lgs.abstraction_period_end_month,
  lgs.restriction_type,
  lgs.threshold_value,
  lgs.threshold_unit,
  lgs.status as comstatus,
  lgs.date_status_updated,
  lgs.licence_version_purpose_condition_id,
  l.licence_ref,
  l.start_date,
  gs.label,
  gs.grid_reference,
  gs.catchment_name,
  gs.river_name,
  gs.wiski_id,
  gs.station_reference,
  gs.easting,
  gs.northing
from
water.gauging_stations gs
join water.licence_gauging_stations lgs on
(lgs.gauging_station_id = gs.gauging_station_id)
join water.licences l on
(l.licence_id = lgs.licence_id)
where
lgs.licence_version_purpose_condition_id is null
and gs.gauging_station_id=:gaugingStationId
union all
select
lvp.abstraction_period_start_day,
  lvp.abstraction_period_start_month,
  lvp.abstraction_period_end_day,
  lvp.abstraction_period_end_month,
  lgs.restriction_type,
  lgs.threshold_value,
  lgs.threshold_unit,
  lgs.status as comstatus,
  lgs.date_status_updated,
  lgs.licence_version_purpose_condition_id,
  l.licence_ref,
  l.start_date,
  gs.label,
  gs.grid_reference,
  gs.catchment_name,
  gs.river_name,
  gs.wiski_id,
  gs.station_reference,
  gs.easting,
  gs.northing
from
water.gauging_stations gs
join water.licence_gauging_stations lgs on
(lgs.gauging_station_id = gs.gauging_station_id)
join water.licences l on
(l.licence_id = lgs.licence_id)
join water.licence_version_purpose_conditions lvpc on
lvpc.licence_version_purpose_condition_id = lgs.licence_version_purpose_condition_id
join water.licence_version_purposes lvp on
lvp.licence_version_purpose_id = lvpc.licence_version_purpose_id
where
lgs.licence_version_purpose_condition_id is not null
and gs.gauging_station_id=:gaugingStationId;`;

exports.findGaugingStationByLicenceId = `SELECT gs.label, gs.gauging_station_id FROM water.licence_gauging_stations lgs 
JOIN water.gauging_stations gs on lgs.gauging_station_id = gs.gauging_station_id
WHERE lgs.licence_id=:licenceId;`;
