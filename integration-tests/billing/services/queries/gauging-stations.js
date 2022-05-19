exports.deleteLinkages = `delete FROM water.licence_gauging_stations where licence_gauging_stations.gauging_station_id IN 
  (select gauging_station_id from water.gauging_stations WHERE is_test = true)`
