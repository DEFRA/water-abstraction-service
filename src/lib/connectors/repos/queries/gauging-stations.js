exports.findGaugingStationWithLinkedLicences = `select distinct
water.licence_gauging_stations.abstraction_period_start_day,
water.licence_gauging_stations.abstraction_period_start_month,
water.licence_gauging_stations.abstraction_period_end_date as abstraction_period_end_day,
water.licence_gauging_stations.abstraction_period_end_month,
water.licence_gauging_stations.restriction_type,
water.licence_gauging_stations.threshold_value,
water.licence_gauging_stations.threshold_unit,
water.licence_gauging_stations.status as comstatus,
water.licence_gauging_stations.date_status_updated,
water.licences.licence_ref,
water.licences.start_date,
water.gauging_stations.label,
water.gauging_stations.grid_reference,
water.gauging_stations.catchment_name,
water.gauging_stations.river_name,
water.gauging_stations.wiski_id,
water.gauging_stations.station_reference,
water.gauging_stations.easting,
water.gauging_stations.northing,
water.licence_version_purpose_condition_types.description,
water.licence_version_purpose_condition_types.subcode_description,
water.licence_version_purposes.abstraction_period_start_day as purposes_abstraction_period_start_day,
water.licence_version_purposes.abstraction_period_start_month as purposes_abstraction_period_start_month,
water.licence_version_purposes.abstraction_period_end_day as purposes_abstraction_period_end_day,
water.licence_version_purposes.abstraction_period_end_month as purposes_abstraction_period_end_month,
water.licence_version_purposes.annual_quantity,
water.licence_versions.end_date from 
water.gauging_stations join water.licence_gauging_stations on (water.gauging_stations.gauging_station_id = water.licence_gauging_stations.gauging_station_id)  
join water.licences on (water.licence_gauging_stations.licence_id = water.licences.licence_id)
join water.licence_versions on (water.licences.licence_id = licence_versions.licence_id)
left join water.licence_version_purposes on 
(water.licence_versions.licence_version_id = water.licence_version_purposes.licence_version_id)
left outer join water.licence_version_purpose_conditions on 
(water.licence_version_purpose_conditions.licence_version_purpose_condition_id = water.licence_gauging_stations.licence_version_purpose_condition_id)
left outer join water.licence_version_purpose_condition_types on (
water.licence_version_purpose_condition_types.licence_version_purpose_condition_type_id
=water.licence_version_purpose_conditions.licence_version_purpose_condition_type_id )
where 
(water.licence_versions.end_date is null or water.licence_versions.end_date > now())
and (water.licences.revoked_date is null or water.licences.revoked_date > now())
and (water.licences.expired_date is null or water.licences.expired_date > now())
and (water.licences.lapsed_date is null or water.licences.lapsed_date > now())
and (water.licence_gauging_stations.date_deleted is null or water.licence_gauging_stations.date_deleted > now()) 
and water.gauging_stations.gauging_station_id=:gaugingStationId;`;
