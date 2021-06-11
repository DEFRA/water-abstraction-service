exports.findGaugingStationWithLinkedLicences = `select gs.*,
lgs.*,
l.licence_id 
from water.gauging_stations gs
join water.licence_gauging_stations lgs on lgs.gauging_station_id = gs.gauging_station_id 
join water.licences l on l.licence_id =lgs.licence_id 
where gs.gauging_station_id=:gaugingStationId;`;
