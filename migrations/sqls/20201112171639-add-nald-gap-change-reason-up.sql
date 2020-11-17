/* Replace with your SQL commands */

insert into water.change_reasons 
(description, position, date_created, triggers_minimum_charge, type)
values ('NALD gap', 1000, NOW(), false, 'new_non_chargeable_charge_version');
