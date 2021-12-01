/* Replace with your SQL commands */

create type water.charging_scheme as enum ('presroc', 'sroc');

ALTER table water.charge_versions
add column charging_scheme water.charging_scheme default 'presroc';

update water.charge_versions set charging_scheme = 'presroc';
