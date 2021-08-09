/* Replace with your SQL commands */
ALTER table water.gauging_stations ADD COLUMN is_test boolean default false;
ALTER table water.licence_gauging_stations ADD COLUMN is_test boolean default false;
