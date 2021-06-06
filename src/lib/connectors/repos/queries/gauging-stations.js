exports.findGaugingStations = `select 
water.licence_version_purpose_condition_types.*,
water.licence_version_purpose_conditions.*,
water.licence_version_purposes.*,
water.licence_versions.end_date,
water.gauging_stations.* from 
water.gauging_stations join water.gauging_station_condition on (water.gauging_stations.gauging_station_id = water.gauging_station_condition.gauging_station_id)  
join water.licences on (water.gauging_station_condition.licence_id = water.licences.licence_id)
join water.licence_versions on (water.licences.licence_id = licence_versions.licence_id)
join water.licence_version_purposes on (water.licence_versions.licence_version_id = water.licence_version_purposes.licence_version_id)
join water.licence_version_purpose_conditions on (water.licence_version_purposes.licence_version_purpose_id = water.licence_version_purpose_conditions.licence_version_purpose_id) 
join water.licence_version_purpose_condition_types on (water.licence_version_purpose_conditions.licence_version_purpose_condition_type_id =
water.licence_version_purpose_condition_types.licence_version_purpose_condition_type_id) 
where (water.licence_versions.end_date is null or water.licence_versions.end_date > now())
and water.gauging_stations.gauging_station_id=:gaugingStationId;`;
