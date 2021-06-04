exports.findGaugingStations = `SELECT water.gauging_stations.* from water.gauging_stations 
join water.gauging_station_condition on  water.gauging_stations.gauging_station_id = water.gauging_station_condition.gauging_station_id  
join water.licences on water.gauging_station_condition.licence_id = water.licences.licence_id
join water.licence_versions on licence_versions.licence_id = water.licences.licence_id WHERE water.gauging_stations.gauging_station_id=:id`;
