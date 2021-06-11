CREATE TYPE water.licence_gauging_stations_alert_types as enum ('stop', 'reduce', 'stop_or_reduce');

alter table water.licence_gauging_stations
  add column alert_type water.licence_gauging_stations_alert_types NOT NULL default 'reduce';
